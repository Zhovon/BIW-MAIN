from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.clinic import (Appointment, AttendanceRecord, Employee)
from app.schemas.clinic import AppointmentCreate, AppointmentRead

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("", response_model=List[AppointmentRead])
def get_appointments(
    branch_id: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)
    if branch_id and branch_id != "all":
        query = query.filter(Appointment.branch_id == branch_id)

    # If date provided, filter by that day
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(
                Appointment.appointment_time >= target_date,
                Appointment.appointment_time < target_date + timedelta(days=1),
            )
        except ValueError:
            pass

    return query.order_by(Appointment.appointment_time.asc()).all()


@router.post("", response_model=AppointmentRead, status_code=201)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    # 1. Validate employee and attendance
    # If employee is absent today, reject
    if payload.employee_id:
        appt_date = payload.appointment_time.strftime("%Y-%m-%d")
        attendance = (
            db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id == payload.employee_id,
                AttendanceRecord.date == appt_date,
            )
            .first()
        )

        if attendance and attendance.status in ["Leave", "Absent"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This therapist is on leave or absent on the selected date.",
            )

    appt = Appointment(
        customer_id=payload.customer_id,
        employee_id=payload.employee_id,
        service_id=payload.service_id,
        branch_id=payload.branch_id,
        appointment_time=payload.appointment_time,
        status=payload.status,
        payment_status=payload.payment_status,
        notes=payload.notes,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


@router.patch("/{appointment_id}/status", response_model=AppointmentRead)
def update_appointment_status(
    appointment_id: str, status: str, db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = status
    db.commit()
    db.refresh(appt)
    return appt


@router.get("/available-employees", response_model=List[dict])
def get_available_employees(branch_id: str, date: str, db: Session = Depends(get_db)):
    """
    Returns employees for a specific branch who are NOT marked as Leave/Absent on the given date.
    """
    employees = (
        db.query(Employee)
        .filter(Employee.branch_id == branch_id, Employee.is_active == True)
        .all()
    )

    # Find absentees
    absentees = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.date == date,
            AttendanceRecord.status.in_(["Leave", "Absent"]),
        )
        .all()
    )
    absent_ids = {a.employee_id for a in absentees}

    available = []
    for emp in employees:
        if emp.id not in absent_ids:
            available.append(
                {"id": emp.id, "full_name": emp.full_name, "role": emp.role}
            )

    return available
