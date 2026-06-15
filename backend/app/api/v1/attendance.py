from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app.db.session import get_db
from app.models.clinic import AttendanceRecord, Employee
from app.schemas.clinic import AttendanceRecordCreate, AttendanceRecordRead
from app.crud.clinic import list_attendance_records

router = APIRouter(prefix="/attendance", tags=["attendance"])

class PunchRequest(BaseModel):
    employee_id: str
    date: str

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

@router.post("/punch", response_model=AttendanceRecordRead)
def punch_time(payload: PunchRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Employee not found")

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == payload.employee_id,
        AttendanceRecord.date == payload.date
    ).first()

    now = datetime.now(timezone.utc)
    local_now = datetime.now()

    start_str = employee.shift_start_time or "10:00"
    end_str = employee.shift_end_time or "19:00"
    try:
        sh, sm = map(int, start_str.split(":"))
        eh, em = map(int, end_str.split(":"))
        shift_duration_hours = (eh + em/60.0) - (sh + sm/60.0)
        if shift_duration_hours < 0:
            shift_duration_hours += 24
    except:
        shift_duration_hours = 9.0
        sh, sm = 10, 0

    if not record:
        status = "Present"
        # Check Late (15 min grace period)
        try:
            expected_start = local_now.replace(hour=sh, minute=sm, second=0, microsecond=0)
            if local_now.timestamp() > expected_start.timestamp() + (15 * 60):
                status = "Late"
        except Exception:
            pass

        record = AttendanceRecord(
            employee_id=payload.employee_id,
            date=payload.date,
            status=status,
            clock_in_time=now
        )
        db.add(record)
    else:
        if record.clock_out_time is None:
            record.clock_out_time = now
            diff = now - record.clock_in_time.replace(tzinfo=timezone.utc)
            diff_hours = diff.total_seconds() / 3600
            if diff_hours > shift_duration_hours:
                record.overtime_minutes = int((diff_hours - shift_duration_hours) * 60)
    
    db.commit()
    db.refresh(record)
    return record

@router.get("/daily")
def get_daily_roster(date: str, branch_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Employee).filter(Employee.is_active == True)
    if branch_id and branch_id != "all":
        query = query.filter(Employee.branch_id == branch_id)
    employees = query.all()

    attendances = db.query(AttendanceRecord).filter(AttendanceRecord.date == date).all()
    att_map = {a.employee_id: a for a in attendances}

    roster = []
    for emp in employees:
        att = att_map.get(emp.id)
        if att:
            roster.append({
                "employee_id": emp.id,
                "full_name": emp.full_name,
                "role": emp.role,
                "status": att.status,
                "clock_in_time": att.clock_in_time.isoformat() if att.clock_in_time else None,
                "clock_out_time": att.clock_out_time.isoformat() if att.clock_out_time else None,
                "overtime_minutes": att.overtime_minutes,
                "deduction_amount": float(att.deduction_amount) if att.deduction_amount else 0.0
            })
        else:
            roster.append({
                "employee_id": emp.id,
                "full_name": emp.full_name,
                "role": emp.role,
                "status": "Absent",
                "clock_in_time": None,
                "clock_out_time": None,
                "overtime_minutes": 0,
                "deduction_amount": 0.0
            })
    return roster
