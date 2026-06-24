from __future__ import annotations
from collections.abc import Sequence
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.clinic import Branch, CostEntry, Customer, Employee, PayrollRun, RevenueEntry, Sale, SaleEmployee, Service, ServiceAssignment, BranchTarget, AttendanceRecord, CustomerReview


def list_branches(db: Session) -> Sequence[Branch]:
    return db.query(Branch).order_by(Branch.created_at.desc()).all()


def list_sales(db: Session) -> Sequence[Sale]:
    return db.query(Sale).options(joinedload(Sale.assigned_employees)).order_by(Sale.created_at.desc()).all()


def list_revenue_entries(db: Session) -> Sequence[RevenueEntry]:
    return db.query(RevenueEntry).order_by(RevenueEntry.created_at.desc()).all()


def list_cost_entries(db: Session) -> Sequence[CostEntry]:
    return db.query(CostEntry).order_by(CostEntry.created_at.desc()).all()


def list_employees(db: Session) -> Sequence[Employee]:
    return db.query(Employee).filter(Employee.is_active == True).order_by(Employee.created_at.desc()).all()


def list_payroll_runs(db: Session) -> Sequence[PayrollRun]:
    return db.query(PayrollRun).order_by(PayrollRun.created_at.desc()).all()


def list_services(db: Session) -> Sequence[Service]:
    return db.query(Service).filter(Service.is_active == True).order_by(Service.created_at.desc()).all()


def list_service_assignments(db: Session) -> Sequence[ServiceAssignment]:
    return db.query(ServiceAssignment).order_by(ServiceAssignment.created_at.desc()).all()


# ── Customer CRUD ─────────────────────────────────────────────

from sqlalchemy import func

def _attach_totals(results):
    customers = []
    for customer, visits, spent in results:
        customer.total_visits = visits
        customer.total_spent = spent
        customers.append(customer)
    return customers

def list_customers(db: Session, skip: int = 0, limit: int = 100) -> Sequence[Customer]:
    results = (
        db.query(
            Customer,
            func.count(Sale.id).label('total_visits'),
            func.coalesce(func.sum(Sale.sale_amount), 0).label('total_spent')
        )
        .outerjoin(Sale, Sale.customer_id == Customer.id)
        .group_by(Customer.id)
        .order_by(Customer.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _attach_totals(results)


def search_customers(db: Session, query: str, skip: int = 0, limit: int = 20) -> Sequence[Customer]:
    pattern = f"%{query}%"
    results = (
        db.query(
            Customer,
            func.count(Sale.id).label('total_visits'),
            func.coalesce(func.sum(Sale.sale_amount), 0).label('total_spent')
        )
        .outerjoin(Sale, Sale.customer_id == Customer.id)
        .filter(
            or_(
                Customer.full_name.ilike(pattern),
                Customer.phone.ilike(pattern),
                Customer.email.ilike(pattern),
            )
        )
        .group_by(Customer.id)
        .order_by(Customer.full_name)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _attach_totals(results)


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
