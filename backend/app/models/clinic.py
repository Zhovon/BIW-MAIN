from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    opening_hours: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    employees: Mapped[list["Employee"]] = relationship(back_populates="branch")
    services: Mapped[list["Service"]] = relationship(back_populates="branch")


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[Optional[str]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    salary: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    bonus_rate: Mapped[float] = mapped_column(Numeric(6, 2), default=0, nullable=False)
    commission_rate: Mapped[float] = mapped_column(Numeric(6, 2), default=0, nullable=False)
    treatment_commission_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    shift_start_time: Mapped[str] = mapped_column(String, default="10:00", nullable=False)
    shift_end_time: Mapped[str] = mapped_column(String, default="19:00", nullable=False)
    off_days: Mapped[str] = mapped_column(String, default="Sunday", nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    branch: Mapped[Optional["Branch"]] = relationship(back_populates="employees")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[Optional[str]] = mapped_column(ForeignKey("branches.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    branch: Mapped[Optional["Branch"]] = relationship(back_populates="services")
    assignments: Mapped[list["ServiceAssignment"]] = relationship(back_populates="service")


class ServiceAssignment(Base):
    __tablename__ = "service_assignments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"))
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"))
    bonus_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    service: Mapped["Service"] = relationship(back_populates="assignments")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sales: Mapped[list["Sale"]] = relationship(back_populates="customer")


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[Optional[str]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    service_id: Mapped[Optional[str]] = mapped_column(ForeignKey("services.id", ondelete="SET NULL"))
    # Legacy single-employee field — kept for backward compatibility
    employee_id: Mapped[Optional[str]] = mapped_column(ForeignKey("employees.id", ondelete="SET NULL"))
    customer_id: Mapped[Optional[str]] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"))
    sale_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer: Mapped[Optional["Customer"]] = relationship(back_populates="sales")
    assigned_employees: Mapped[list["SaleEmployee"]] = relationship(back_populates="sale", cascade="all, delete-orphan")


class SaleEmployee(Base):
    """Junction table: multiple employees can be assigned to a single sale/treatment."""
    __tablename__ = "sale_employees"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    sale_id: Mapped[str] = mapped_column(ForeignKey("sales.id", ondelete="CASCADE"))
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sale: Mapped["Sale"] = relationship(back_populates="assigned_employees")


class RevenueEntry(Base):
    __tablename__ = "revenue_entries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[Optional[str]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    source: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CostEntry(Base):
    __tablename__ = "cost_entries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[Optional[str]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    cost_type: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[Optional[str]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    month: Mapped[str] = mapped_column(String, nullable=False)
    salary_total: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    bonus_total: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    commission_total: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BranchTarget(Base):
    __tablename__ = "branch_targets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id", ondelete="CASCADE"))
    month: Mapped[str] = mapped_column(String, nullable=False)  # Format YYYY-MM
    target_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    branch: Mapped["Branch"] = relationship()


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"))
    date: Mapped[str] = mapped_column(String, nullable=False)  # Format YYYY-MM-DD
    status: Mapped[str] = mapped_column(String, nullable=False)  # 'Late', 'Leave', 'Present'
    deduction_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    clock_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    clock_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    overtime_minutes: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    employee: Mapped["Employee"] = relationship()


class CustomerReview(Base):
    __tablename__ = "customer_reviews"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    branch_id: Mapped[Optional[str]] = mapped_column(ForeignKey("branches.id", ondelete="SET NULL"))
    customer_id: Mapped[Optional[str]] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"))
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(nullable=False)
    review_text: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    employee: Mapped["Employee"] = relationship()
    customer: Mapped[Optional["Customer"]] = relationship()
    branch: Mapped[Optional["Branch"]] = relationship()
