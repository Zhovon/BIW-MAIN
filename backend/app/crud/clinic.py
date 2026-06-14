from __future__ import annotations
from collections.abc import Sequence
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.clinic import Branch, CostEntry, Customer, Employee, PayrollRun, RevenueEntry, Sale, SaleEmployee, Service, ServiceAssignment


def list_branches(db: Session) -> Sequence[Branch]:
    return db.query(Branch).order_by(Branch.created_at.desc()).all()


def list_sales(db: Session) -> Sequence[Sale]:
    return db.query(Sale).options(joinedload(Sale.assigned_employees)).order_by(Sale.created_at.desc()).all()


def list_revenue_entries(db: Session) -> Sequence[RevenueEntry]:
    return db.query(RevenueEntry).order_by(RevenueEntry.created_at.desc()).all()


def list_cost_entries(db: Session) -> Sequence[CostEntry]:
    return db.query(CostEntry).order_by(CostEntry.created_at.desc()).all()


def list_employees(db: Session) -> Sequence[Employee]:
    return db.query(Employee).order_by(Employee.created_at.desc()).all()


def list_payroll_runs(db: Session) -> Sequence[PayrollRun]:
    return db.query(PayrollRun).order_by(PayrollRun.created_at.desc()).all()


def list_services(db: Session) -> Sequence[Service]:
    return db.query(Service).order_by(Service.created_at.desc()).all()


def list_service_assignments(db: Session) -> Sequence[ServiceAssignment]:
    return db.query(ServiceAssignment).order_by(ServiceAssignment.created_at.desc()).all()


# ── Customer CRUD ─────────────────────────────────────────────

def list_customers(db: Session) -> Sequence[Customer]:
    return db.query(Customer).order_by(Customer.created_at.desc()).all()


def search_customers(db: Session, query: str) -> Sequence[Customer]:
    pattern = f"%{query}%"
    return (
        db.query(Customer)
        .filter(
            or_(
                Customer.full_name.ilike(pattern),
                Customer.phone.ilike(pattern),
                Customer.email.ilike(pattern),
            )
        )
        .order_by(Customer.full_name)
        .limit(20)
        .all()
    )


def get_customer_by_id(db: Session, customer_id: str) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.id == customer_id).first()


# ── Sale Employees ────────────────────────────────────────────

def get_sale_employee_ids(db: Session, sale_id: str) -> list[str]:
    rows = db.query(SaleEmployee.employee_id).filter(SaleEmployee.sale_id == sale_id).all()
    return [r[0] for r in rows]
