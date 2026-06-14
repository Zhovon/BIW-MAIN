from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.clinic import list_revenue_entries
from app.db.session import get_db
from app.models.clinic import RevenueEntry
from app.schemas.clinic import RevenueEntryCreate, RevenueEntryRead

router = APIRouter(prefix="/revenue", tags=["revenue"])


@router.get("", response_model=list[RevenueEntryRead])
def get_revenue_entries(db: Session = Depends(get_db)):
    return list_revenue_entries(db)


@router.post("", response_model=RevenueEntryRead, status_code=201)
def create_revenue_entry(payload: RevenueEntryCreate, db: Session = Depends(get_db)) -> RevenueEntry:
    revenue_entry = RevenueEntry(
        branch_id=payload.branch_id,
        source=payload.source,
        amount=payload.amount,
    )
    db.add(revenue_entry)
    db.commit()
    db.refresh(revenue_entry)
    return revenue_entry
