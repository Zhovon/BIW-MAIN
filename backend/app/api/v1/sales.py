from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.crud.clinic import list_sales
from app.db.session import get_db
from app.models.clinic import (Employee, RevenueEntry, Sale, SaleEmployee,
                               Service)
from app.schemas.clinic import SaleCreate, SaleRead

router = APIRouter(prefix="/sales", tags=["sales"])


def _sale_to_read(sale: Sale) -> dict:
    """Convert a Sale ORM object to a SaleRead-compatible dict with employee_ids populated."""
    employee_ids = (
        [se.employee_id for se in sale.assigned_employees]
        if sale.assigned_employees
        else []
    )
    # Fallback: if no junction records exist but legacy employee_id is set
    if not employee_ids and sale.employee_id:
        employee_ids = [sale.employee_id]
    return {
        "id": sale.id,
        "branch_id": sale.branch_id,
        "service_id": sale.service_id,
        "employee_id": sale.employee_id,
        "customer_id": sale.customer_id,
        "employee_ids": employee_ids,
        "sale_amount": float(sale.sale_amount),
        "discount_amount": float(sale.discount_amount),
        "created_at": sale.created_at,
    }


from typing import Optional


@router.get("", response_model=list[SaleRead])
def get_sales(
    limit: int = 50,
    date: Optional[str] = None,
    month: Optional[str] = None,
    db: Session = Depends(get_db),
):
    sales = list_sales(db, limit=limit, date_str=date, month_str=month)
    return [_sale_to_read(s) for s in sales]


@router.get("/customer/{customer_id}", response_model=list[SaleRead])
def get_sales_by_customer(customer_id: str, db: Session = Depends(get_db)):
    sales = (
        db.query(Sale)
        .options(joinedload(Sale.assigned_employees))
        .filter(Sale.customer_id == customer_id)
        .order_by(Sale.created_at.desc())
        .all()
    )
    return [_sale_to_read(s) for s in sales]


@router.post("", response_model=SaleRead, status_code=201)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    # 1. Verify service exists
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # 2. Determine employee list: prefer employee_ids, fallback to single employee_id
    employee_ids = payload.employee_ids if payload.employee_ids else []
    if not employee_ids and payload.employee_id:
        employee_ids = [payload.employee_id]

    if not employee_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one employee must be assigned to a treatment.",
        )

    # 3. Verify all employees exist and are active
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    found_ids = {e.id for e in employees}
    missing = set(employee_ids) - found_ids
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employees not found: {', '.join(missing)}",
        )
    inactive = [e for e in employees if not e.is_active]
    if inactive:
        names = ", ".join(e.full_name for e in inactive)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inactive employees cannot be assigned: {names}",
        )

    # 4. Inherit branch_id from first employee or service if not supplied
    branch_id = payload.branch_id
    if not branch_id:
        branch_id = employees[0].branch_id or service.branch_id

    # 5. Create sale (keep legacy employee_id as first employee for backward compat)
    sale = Sale(
        branch_id=branch_id,
        service_id=payload.service_id,
        employee_id=employee_ids[0],
        customer_id=payload.customer_id,
        sale_amount=payload.sale_amount,
        discount_amount=payload.discount_amount,
    )
    db.add(sale)
    db.flush()  # Get sale.id before creating junction records

    # 6. Create junction records for all assigned employees
    for emp_id in employee_ids:
        sale_emp = SaleEmployee(sale_id=sale.id, employee_id=emp_id)
        db.add(sale_emp)

    # 7. Auto-generate revenue entry
    revenue = RevenueEntry(
        branch_id=branch_id,
        source=f"Treatment: {service.name}",
        amount=payload.sale_amount,
    )
    db.add(revenue)

    try:
        db.commit()
        db.refresh(sale)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed: {str(e)}",
        )

    return _sale_to_read(sale)
