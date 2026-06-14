from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.clinic import list_branches
from app.db.session import get_db
from app.models.clinic import Branch
from app.schemas.clinic import BranchCreate, BranchRead, BranchUpdate

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("", response_model=list[BranchRead])
def get_branches(db: Session = Depends(get_db)):
    return list_branches(db)


@router.post("", response_model=BranchRead, status_code=201)
def create_branch(payload: BranchCreate, db: Session = Depends(get_db)) -> Branch:
    branch = Branch(
        name=payload.name,
        city=payload.city,
        address=payload.address,
        phone=payload.phone,
        opening_hours=payload.opening_hours,
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


@router.put("/{branch_id}", response_model=BranchRead)
def update_branch(branch_id: str, payload: BranchUpdate, db: Session = Depends(get_db)) -> Branch:
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(branch, field, value)

    try:
        db.commit()
        db.refresh(branch)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update branch: {str(e)}",
        )
    return branch
