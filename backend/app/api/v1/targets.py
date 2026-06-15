from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.clinic import BranchTarget
from app.schemas.clinic import BranchTargetCreate, BranchTargetRead
from app.crud.clinic import list_branch_targets

router = APIRouter(prefix="/targets", tags=["targets"])

@router.get("", response_model=List[BranchTargetRead])
def get_branch_targets(branch_id: Optional[str] = None, db: Session = Depends(get_db)):
    return list_branch_targets(db, branch_id)

@router.post("", response_model=BranchTargetRead, status_code=201)
def create_branch_target(payload: BranchTargetCreate, db: Session = Depends(get_db)) -> BranchTarget:
    target = BranchTarget(
        branch_id=payload.branch_id,
        month=payload.month,
        target_amount=payload.target_amount
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return target
