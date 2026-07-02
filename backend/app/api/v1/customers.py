from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.clinic import list_customers, search_customers
from app.db.session import get_db
from app.models.clinic import Customer
from app.schemas.clinic import CustomerCreate, CustomerRead

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerRead])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return list_customers(db, skip=skip, limit=limit)


@router.get("/search", response_model=list[CustomerRead])
def search_customers_endpoint(
    q: str = "", skip: int = 0, limit: int = 20, db: Session = Depends(get_db)
):
    if not q.strip():
        return list_customers(db, skip=skip, limit=limit)
    return search_customers(db, q.strip(), skip=skip, limit=limit)


@router.post("", response_model=CustomerRead, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)) -> Customer:
    # Generate sequential 5-digit ID (e.g. 00001)
    # Find all current IDs, filter to numeric ones, find max
    current_ids = db.query(Customer.id).all()
    max_numeric_id = 0
    for row in current_ids:
        if row.id and row.id.isdigit():
            val = int(row.id)
            if val > max_numeric_id:
                max_numeric_id = val

    new_id_num = max_numeric_id + 1
    new_id_str = f"{new_id_num:05d}"

    customer = Customer(
        id=new_id_str,
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        notes=payload.notes,
    )
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create customer: {str(e)}",
        )
    return customer
