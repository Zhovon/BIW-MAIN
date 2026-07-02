from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.clinic import list_cost_entries
from app.db.session import get_db
from app.models.clinic import CostEntry
from app.schemas.clinic import CostEntryCreate, CostEntryRead

router = APIRouter(prefix="/costs", tags=["costs"])


from typing import Optional


@router.get("", response_model=list[CostEntryRead])
def get_costs(
    limit: int = 50,
    date: Optional[str] = None,
    month: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return list_cost_entries(db, limit=limit, date_str=date, month_str=month)


@router.post("", response_model=CostEntryRead, status_code=201)
def create_cost(payload: CostEntryCreate, db: Session = Depends(get_db)) -> CostEntry:
    cost = CostEntry(
        branch_id=payload.branch_id,
        cost_type=payload.cost_type,
        amount=payload.amount,
        note=payload.note,
    )
    db.add(cost)
    db.commit()
    db.refresh(cost)
    return cost
