from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.crud.clinic import list_services
from app.db.session import get_db
from app.models.clinic import Service
from app.schemas.clinic import ServiceCreate, ServiceRead, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceRead])
def get_services(db: Session = Depends(get_db)):
    return list_services(db)


@router.post(
    "",
    response_model=ServiceRead,
    status_code=201,
    dependencies=[Depends(get_current_user)],
)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)) -> Service:
    service = Service(
        branch_id=payload.branch_id,
        name=payload.name,
        price=payload.price,
        cost=payload.cost,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put(
    "/{service_id}",
    response_model=ServiceRead,
    dependencies=[Depends(get_current_user)],
)
def update_service(
    service_id: str, payload: ServiceUpdate, db: Session = Depends(get_db)
) -> Service:
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    try:
        db.commit()
        db.refresh(service)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update service: {str(e)}",
        )
    return service


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_user)],
)
def delete_service(service_id: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    try:
        service.is_active = False
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete service: {str(e)}",
        )
