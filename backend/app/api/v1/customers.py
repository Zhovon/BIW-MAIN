from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.clinic import list_customers, search_customers
from app.db.session import get_db
from app.models.clinic import Customer
from app.schemas.clinic import CustomerCreate, CustomerRead

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerRead])
def get_customers(db: Session = Depends(get_db)):
    return list_customers(db)


@router.get("/search", response_model=list[CustomerRead])
def search_customers_endpoint(q: str = "", db: Session = Depends(get_db)):
    if not q.strip():
        return list_customers(db)
    return search_customers(db, q.strip())


@router.post("", response_model=CustomerRead, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)) -> Customer:
    customer = Customer(
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
