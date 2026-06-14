from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.clinic import list_service_assignments
from app.db.session import get_db
from app.models.clinic import ServiceAssignment
from app.schemas.clinic import ServiceAssignmentCreate, ServiceAssignmentRead

router = APIRouter(prefix="/service-assignments", tags=["service-assignments"])


@router.get("", response_model=list[ServiceAssignmentRead])
def get_service_assignments(db: Session = Depends(get_db)):
    return list_service_assignments(db)


@router.post("", response_model=ServiceAssignmentRead, status_code=201)
def create_service_assignment(payload: ServiceAssignmentCreate, db: Session = Depends(get_db)) -> ServiceAssignment:
    assignment = ServiceAssignment(
        service_id=payload.service_id,
        employee_id=payload.employee_id,
        bonus_amount=payload.bonus_amount,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
