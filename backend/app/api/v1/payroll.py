from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.crud.clinic import list_payroll_runs
from app.db.session import get_db
from app.models.clinic import Branch, Employee, PayrollRun, Sale, Service, ServiceAssignment, BranchTarget, AttendanceRecord
from app.schemas.clinic import PayrollRunCreate, PayrollRunRead

router = APIRouter(prefix="/payroll", tags=["payroll"])


def calculate_employee_earnings(db: Session, employee: Employee, year: int, month: int):
    # Fetch all sales for this employee in the given year and month
    sales = db.query(Sale).filter(
        Sale.employee_id == employee.id,
        extract("year", Sale.created_at) == year,
        extract("month", Sale.created_at) == month,
    ).all()

    bonus_earned = 0.0
    commission_earned = 0.0
    treatments_details = []

    for sale in sales:
        service = db.query(Service).filter(Service.id == sale.service_id).first()
        service_name = service.name if service else "Unknown Service"

        # Check service assignments for therapist + service bonus
        assignment = db.query(ServiceAssignment).filter(
            ServiceAssignment.employee_id == employee.id,
            ServiceAssignment.service_id == sale.service_id,
        ).first()

        earned = 0.0
        earning_type = "commission"

        # For non-managers, calculate commission from sales directly
        if employee.role.lower() != "manager":
            if assignment:
                earned = float(assignment.bonus_amount)
                bonus_earned += earned
                earning_type = "bonus"
            else:
                # Commission calculation: Fixed amount per treatment, OR percentage if configured
                treatment_fixed = float(employee.treatment_commission_amount)
                if treatment_fixed > 0:
                    earned = treatment_fixed
                else:
                    rate = float(employee.commission_rate) / 100.0
                    earned = float(sale.sale_amount) * rate
                commission_earned += earned

        treatments_details.append(
            {
                "id": sale.id,
                "service_name": service_name,
                "sale_amount": float(sale.sale_amount),
                "discount_amount": float(sale.discount_amount),
                "earned_amount": earned,
                "earning_type": earning_type,
                "created_at": sale.created_at.isoformat() if sale.created_at else None,
            }
        )

    # Manager-specific logic for commission based on branch target
    if employee.role.lower() == "manager" and employee.branch_id:
        target_record = db.query(BranchTarget).filter(
            BranchTarget.branch_id == employee.branch_id,
            BranchTarget.month == f"{year}-{month:02d}"
        ).first()
        
        target_amount = float(target_record.target_amount) if target_record else 0.0

        # Calculate total branch revenue
        branch_sales = db.query(Sale).filter(
            Sale.branch_id == employee.branch_id,
            extract("year", Sale.created_at) == year,
            extract("month", Sale.created_at) == month,
        ).all()
        branch_revenue = sum([float(s.sale_amount) for s in branch_sales])
        
        if branch_revenue > target_amount and target_amount > 0:
            extra_revenue = branch_revenue - target_amount
            rate = float(employee.commission_rate) / 100.0
            commission_earned += extra_revenue * rate

    # Calculate Deductions
    month_str = f"{year}-{month:02d}"
    attendances = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == employee.id,
        AttendanceRecord.date.startswith(month_str)
    ).all()

    late_count = sum([1 for a in attendances if a.status.lower() == "late"])
    late_deduction = float(employee.salary) / 30.0 * (late_count // 3)

    leave_deduction = sum([float(a.deduction_amount) for a in attendances if a.deduction_amount])
    total_deductions = late_deduction + leave_deduction

    total_earned = float(employee.salary) + bonus_earned + commission_earned - total_deductions

    return {
        "base_salary": float(employee.salary),
        "bonus_earned": bonus_earned,
        "commission_earned": commission_earned,
        "late_deduction": late_deduction,
        "leave_deduction": leave_deduction,
        "total_deductions": total_deductions,
        "total_earned": total_earned if total_earned > 0 else 0.0,
        "treatment_count": len(sales),
        "treatments": treatments_details,
    }


@router.get("", response_model=list[PayrollRunRead])
def get_payroll_runs(db: Session = Depends(get_db)):
    return list_payroll_runs(db)


@router.post("", response_model=PayrollRunRead, status_code=201)
def create_payroll_run(payload: PayrollRunCreate, db: Session = Depends(get_db)) -> PayrollRun:
    payroll_run = PayrollRun(
        branch_id=payload.branch_id,
        month=payload.month,
        salary_total=payload.salary_total,
        bonus_total=payload.bonus_total,
        commission_total=payload.commission_total,
    )
    db.add(payroll_run)
    db.commit()
    db.refresh(payroll_run)
    return payroll_run


@router.get("/calculate")
def calculate_branch_payroll(branch_id: str, month: str, db: Session = Depends(get_db)):
    # Validate branch exists
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found",
        )

    try:
        parts = month.split("-")
        year = int(parts[0])
        val_month = int(parts[1])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month format. Use YYYY-MM",
        )

    # Get active employees for this branch
    employees = db.query(Employee).filter(
        Employee.branch_id == branch_id,
        Employee.is_active == True,
    ).all()

    employees_breakdown = []
    salary_total = 0.0
    bonus_total = 0.0
    commission_total = 0.0

    for emp in employees:
        earnings = calculate_employee_earnings(db, emp, year, val_month)
        employees_breakdown.append(
            {
                "employee_id": emp.id,
                "full_name": emp.full_name,
                "role": emp.role,
                "base_salary": earnings["base_salary"],
                "bonus_earned": earnings["bonus_earned"],
                "commission_earned": earnings["commission_earned"],
                "late_deduction": earnings.get("late_deduction", 0),
                "leave_deduction": earnings.get("leave_deduction", 0),
                "total_deductions": earnings.get("total_deductions", 0),
                "total_earned": earnings["total_earned"],
                "treatment_count": earnings["treatment_count"],
            }
        )
        salary_total += earnings["base_salary"]
        bonus_total += earnings["bonus_earned"]
        commission_total += earnings["commission_earned"]

    return {
        "branch_id": branch_id,
        "branch_name": branch.name,
        "month": month,
        "salary_total": salary_total,
        "bonus_total": bonus_total,
        "commission_total": commission_total,
        "total_payroll": salary_total + bonus_total + commission_total,
        "employees": employees_breakdown,
    }


@router.get("/employee/{employee_id}")
def get_employee_earnings_by_id(employee_id: str, month: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    try:
        parts = month.split("-")
        year = int(parts[0])
        val_month = int(parts[1])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month format. Use YYYY-MM",
        )

    earnings = calculate_employee_earnings(db, employee, year, val_month)
    return {
        "employee_id": employee.id,
        "full_name": employee.full_name,
        "role": employee.role,
        "month": month,
        "base_salary": earnings["base_salary"],
        "bonus_earned": earnings["bonus_earned"],
        "commission_earned": earnings["commission_earned"],
        "late_deduction": earnings.get("late_deduction", 0),
        "leave_deduction": earnings.get("leave_deduction", 0),
        "total_deductions": earnings.get("total_deductions", 0),
        "total_earned": earnings["total_earned"],
        "treatment_count": earnings["treatment_count"],
        "treatments": earnings["treatments"],
    }


@router.get("/employee/user/{user_id}")
def get_employee_earnings_by_user_id(user_id: str, month: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for this user account.",
        )

    try:
        parts = month.split("-")
        year = int(parts[0])
        val_month = int(parts[1])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month format. Use YYYY-MM",
        )

    earnings = calculate_employee_earnings(db, employee, year, val_month)
    return {
        "employee_id": employee.id,
        "full_name": employee.full_name,
        "role": employee.role,
        "month": month,
        "base_salary": earnings["base_salary"],
        "bonus_earned": earnings["bonus_earned"],
        "commission_earned": earnings["commission_earned"],
        "late_deduction": earnings.get("late_deduction", 0),
        "leave_deduction": earnings.get("leave_deduction", 0),
        "total_deductions": earnings.get("total_deductions", 0),
        "total_earned": earnings["total_earned"],
        "treatment_count": earnings["treatment_count"],
        "treatments": earnings["treatments"],
    }
