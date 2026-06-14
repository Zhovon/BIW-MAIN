from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.clinic import list_cost_entries
from app.db.session import get_db
from app.models.clinic import CostEntry
from app.schemas.clinic import CostEntryCreate, CostEntryRead

router = APIRouter(prefix="/costs", tags=["costs"])


@router.get("", response_model=list[CostEntryRead])
def get_costs(db: Session = Depends(get_db)):
    return list_cost_entries(db)


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
