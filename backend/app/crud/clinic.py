from __future__ import annotations
from collections.abc import Sequence
from typing import Optional

from sqlalchemy import or_, func, cast, Date
from sqlalchemy.orm import Session, joinedload

from app.models.clinic import Branch, CostEntry, Customer, Employee, PayrollRun, RevenueEntry, Sale, SaleEmployee, Service, ServiceAssignment, BranchTarget, AttendanceRecord, CustomerReview


def list_branches(db: Session) -> Sequence[Branch]:
    return db.query(Branch).order_by(Branch.created_at.desc()).all()


def list_sales(db: Session, limit: int = 50, date_str: Optional[str] = None, month_str: Optional[str] = None) -> Sequence[Sale]:
    q = db.query(Sale).options(joinedload(Sale.assigned_employees))
    if date_str:
        q = q.filter(cast(Sale.created_at, Date) == cast(date_str, Date))
    if month_str:
        q = q.filter(func.to_char(Sale.created_at, 'YYYY-MM') == month_str)
    return q.order_by(Sale.created_at.desc()).limit(limit).all()


def list_revenue_entries(db: Session) -> Sequence[RevenueEntry]:
    return db.query(RevenueEntry).order_by(RevenueEntry.created_at.desc()).all()


def list_cost_entries(db: Session, limit: int = 50, date_str: Optional[str] = None, month_str: Optional[str] = None) -> Sequence[CostEntry]:
    q = db.query(CostEntry)
    if date_str:
        q = q.filter(cast(CostEntry.created_at, Date) == cast(date_str, Date))
    if month_str:
        q = q.filter(func.to_char(CostEntry.created_at, 'YYYY-MM') == month_str)
    return q.order_by(CostEntry.created_at.desc()).limit(limit).all()


def list_employees(db: Session) -> Sequence[Employee]:
    return db.query(Employee).filter(Employee.is_active == True).order_by(Employee.created_at.desc()).all()


def list_payroll_runs(db: Session) -> Sequence[PayrollRun]:
    return db.query(PayrollRun).order_by(PayrollRun.created_at.desc()).all()


def list_services(db: Session) -> Sequence[Service]:
    return db.query(Service).filter(Service.is_active == True).order_by(Service.created_at.desc()).all()


def list_service_assignments(db: Session) -> Sequence[ServiceAssignment]:
    return db.query(ServiceAssignment).order_by(ServiceAssignment.created_at.desc()).all()


# ── Customer CRUD ─────────────────────────────────────────────


def _attach_totals(customers, db: Session):
    if not customers:
        return []
    
    customer_ids = [c.id for c in customers]
    aggs = db.query(
        Sale.customer_id,
        func.count(Sale.id).label('total_visits'),
        func.coalesce(func.sum(Sale.sale_amount), 0).label('total_spent')
    ).filter(Sale.customer_id.in_(customer_ids)).group_by(Sale.customer_id).all()
    
    agg_map = {row.customer_id: {'visits': row.total_visits, 'spent': row.total_spent} for row in aggs}
    
    for c in customers:
        c.total_visits = agg_map.get(c.id, {}).get('visits', 0)
        c.total_spent = agg_map.get(c.id, {}).get('spent', 0)
        
    return customers

def list_customers(db: Session, skip: int = 0, limit: int = 100) -> Sequence[Customer]:
    customers = db.query(Customer).order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
    return _attach_totals(customers, db)


def search_customers(db: Session, query: str, skip: int = 0, limit: int = 20) -> Sequence[Customer]:
    pattern = f"%{query}%"
    customers = (
        db.query(Customer)
        .filter(
            or_(
                Customer.full_name.ilike(pattern),
                Customer.phone.ilike(pattern),
                Customer.email.ilike(pattern),
            )
        )
        .order_by(Customer.full_name)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _attach_totals(customers, db)


def get_customer_by_id(db: Session, customer_id: str) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.id == customer_id).first()


# ── Sale Employees ────────────────────────────────────────────

def get_sale_employee_ids(db: Session, sale_id: str) -> list[str]:
    rows = db.query(SaleEmployee.employee_id).filter(SaleEmployee.sale_id == sale_id).all()
    return [r[0] for r in rows]

# ── Branch Targets ────────────────────────────────────────────

def list_branch_targets(db: Session, branch_id: Optional[str] = None) -> Sequence[BranchTarget]:
    query = db.query(BranchTarget)
    if branch_id:
        query = query.filter(BranchTarget.branch_id == branch_id)
    return query.order_by(BranchTarget.month.desc()).all()


# ── Attendance Records ────────────────────────────────────────

def list_attendance_records(db: Session, employee_id: Optional[str] = None) -> Sequence[AttendanceRecord]:
    query = db.query(AttendanceRecord)
    if employee_id:
        query = query.filter(AttendanceRecord.employee_id == employee_id)
    return query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.created_at.desc()).all()


# ── Customer Reviews ──────────────────────────────────────────

def list_customer_reviews(db: Session, employee_id: Optional[str] = None) -> Sequence[CustomerReview]:
    query = db.query(CustomerReview)
    if employee_id:
        query = query.filter(CustomerReview.employee_id == employee_id)
    return query.order_by(CustomerReview.created_at.desc()).all()
