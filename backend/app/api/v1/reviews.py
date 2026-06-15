from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.clinic import CustomerReview
from app.schemas.clinic import CustomerReviewCreate, CustomerReviewRead
from app.crud.clinic import list_customer_reviews

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("", response_model=List[CustomerReviewRead])
def get_customer_reviews(employee_id: Optional[str] = None, db: Session = Depends(get_db)):
    return list_customer_reviews(db, employee_id)

@router.post("", response_model=CustomerReviewRead, status_code=201)
def create_customer_review(payload: CustomerReviewCreate, db: Session = Depends(get_db)) -> CustomerReview:
    review = CustomerReview(
        branch_id=payload.branch_id,
        customer_id=payload.customer_id,
        employee_id=payload.employee_id,
        rating=payload.rating,
        review_text=payload.review_text
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
