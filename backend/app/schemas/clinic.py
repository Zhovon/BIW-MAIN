from __future__ import annotations
from datetime import datetime
from typing import Optional, Union, List
from pydantic import BaseModel, ConfigDict
class BranchCreate(BaseModel):
    name: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = None


class BranchRead(BranchCreate):
    id: str
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceRead(BaseModel):
    id: str
    branch_id: Optional[str] = None
    name: str
    price: float
    cost: float = 0

    model_config = ConfigDict(from_attributes=True)


class ServiceCreate(BaseModel):
    branch_id: Optional[str] = None
    name: str
    price: float
    cost: float = 0


class ServiceUpdate(BaseModel):
    branch_id: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None


class EmployeeRead(BaseModel):
    id: str
    branch_id: Optional[str] = None
    full_name: str
    role: str
    salary: float
    bonus_rate: float = 0
    commission_rate: float = 0
    treatment_commission_amount: float = 0.0
    shift_start_time: str = "10:00"
    shift_end_time: str = "19:00"
    off_days: str = "Sunday"
    email: Optional[str] = None
    user_id: Optional[str] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class EmployeeCreate(BaseModel):
    branch_id: Optional[str] = None
    full_name: str
    role: str
    salary: float
    bonus_rate: float = 0
    commission_rate: float = 0
    treatment_commission_amount: float = 0.0
    shift_start_time: str = "10:00"
    shift_end_time: str = "19:00"
    off_days: str = "Sunday"
    email: Optional[str] = None
    user_id: Optional[str] = None
    password: Optional[str] = None


class ServiceAssignmentRead(BaseModel):
    id: str
    service_id: str
    employee_id: str
    bonus_amount: float

    model_config = ConfigDict(from_attributes=True)


class ServiceAssignmentCreate(BaseModel):
    service_id: str
    employee_id: str
    bonus_amount: float = 0


# ── Customer CRM ──────────────────────────────────────────────

class CustomerCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None


class CustomerRead(CustomerCreate):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ── Sale (with multi-employee + customer) ─────────────────────

class SaleEmployeeRead(BaseModel):
    id: str
    sale_id: str
    employee_id: str

    model_config = ConfigDict(from_attributes=True)


class SaleRead(BaseModel):
    id: str
    branch_id: Optional[str] = None
    service_id: Optional[str] = None
    employee_id: Optional[str] = None
    customer_id: Optional[str] = None
    employee_ids: List[str] = []
    sale_amount: float
    discount_amount: float = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SaleCreate(BaseModel):
    branch_id: Optional[str] = None
    service_id: Optional[str] = None
    employee_id: Optional[str] = None
    employee_ids: List[str] = []
    customer_id: Optional[str] = None
    sale_amount: float
    discount_amount: float = 0


class RevenueEntryRead(BaseModel):
    id: str
    branch_id: Optional[str] = None
    source: str
    amount: float

    model_config = ConfigDict(from_attributes=True)


class RevenueEntryCreate(BaseModel):
    branch_id: Optional[str] = None
    source: str
    amount: float


class CostEntryRead(BaseModel):
    id: str
    branch_id: Optional[str] = None
    cost_type: str
    amount: float
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CostEntryCreate(BaseModel):
    branch_id: Optional[str] = None
    cost_type: str
    amount: float
    note: Optional[str] = None


class PayrollRunRead(BaseModel):
    id: str
    branch_id: Optional[str] = None
    month: str
    salary_total: float
    bonus_total: float
    commission_total: float

    model_config = ConfigDict(from_attributes=True)


class PayrollRunCreate(BaseModel):
    branch_id: Optional[str] = None
    month: str
    salary_total: float = 0
    bonus_total: float = 0
    commission_total: float = 0


class OverviewBranchRead(BaseModel):
    branch: str
    revenue: float
    cost: float
    profit: float


class OverviewRead(BaseModel):
    revenue_total: float
    cost_total: float
    profit_total: float
    branches: list[OverviewBranchRead]


# ── Chart Response Schemas ────────────────────────────────────

class MonthlyChartEntry(BaseModel):
    month: str
    sales: float
    revenue: float
    costs: float


class BranchChartEntry(BaseModel):
    branch: str
    sales: float
    revenue: float
    costs: float
    profit: float


class OverviewChartsRead(BaseModel):
    monthly_trend: list[MonthlyChartEntry]
    branch_comparison: list[BranchChartEntry]


class DailyChartEntry(BaseModel):
    date: str
    sales: float
    costs: float
    profit: float


class DailyChartsRead(BaseModel):
    daily_trend: list[DailyChartEntry]
    average_daily_sales: float
    total_sales: float
    total_costs: float
    profit_margin: float


# ── Target, Attendance & Review Schemas ───────────────────────

class BranchTargetRead(BaseModel):
    id: str
    branch_id: str
    month: str
    target_amount: float

    model_config = ConfigDict(from_attributes=True)

class BranchTargetCreate(BaseModel):
    branch_id: str
    month: str
    target_amount: float


class AttendanceRecordRead(BaseModel):
    id: str
    employee_id: str
    date: str
    status: str
    deduction_amount: float
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AttendanceRecordCreate(BaseModel):
    employee_id: str
    date: str
    status: str
    deduction_amount: float = 0.0
    clock_in_time: Optional[datetime] = None
    clock_out_time: Optional[datetime] = None
    overtime_minutes: int = 0


class CustomerReviewRead(BaseModel):
    id: str
    branch_id: Optional[str] = None
    customer_id: Optional[str] = None
    employee_id: str
    rating: int
    review_text: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerReviewCreate(BaseModel):
    branch_id: Optional[str] = None
    customer_id: Optional[str] = None
    employee_id: str
    rating: int
    review_text: Optional[str] = None
