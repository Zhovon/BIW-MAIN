from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.clinic import AttendanceRecord
from app.schemas.clinic import AttendanceRecordCreate, AttendanceRecordRead
from app.crud.clinic import list_attendance_records

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("", response_model=List[AttendanceRecordRead])
def get_attendance_records(employee_id: Optional[str] = None, db: Session = Depends(get_db)):
    return list_attendance_records(db, employee_id)

@router.post("", response_model=AttendanceRecordRead, status_code=201)
def create_attendance_record(payload: AttendanceRecordCreate, db: Session = Depends(get_db)) -> AttendanceRecord:
    record = AttendanceRecord(
        employee_id=payload.employee_id,
        date=payload.date,
        status=payload.status,
        deduction_amount=payload.deduction_amount
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
