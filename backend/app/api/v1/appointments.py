from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.clinic import (Appointment, AttendanceRecord, Employee, Customer, Service)
from app.schemas.clinic import AppointmentCreate, AppointmentRead
from app.core.config import settings

import resend
resend.api_key = settings.resend_api_key

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

    # 2. Find or create customer if customer_id not provided
    customer_id = payload.customer_id
    if not customer_id and payload.customer_phone and payload.customer_name:
        customer = db.query(Customer).filter(Customer.phone == payload.customer_phone).first()
        if customer:
            customer_id = customer.id
            if payload.customer_email and not customer.email:
                customer.email = payload.customer_email
        else:
            # Generate sequential 5-digit ID (e.g. 00001) for new customer
            current_ids = db.query(Customer.id).all()
            max_numeric_id = max([int(row.id) for row in current_ids if row.id and row.id.isdigit()], default=0)
            new_id_str = f"{(max_numeric_id + 1):05d}"
            
            customer = Customer(
                id=new_id_str,
                full_name=payload.customer_name,
                phone=payload.customer_phone,
                email=payload.customer_email,
            )
            db.add(customer)
            db.flush()
            customer_id = new_id_str

    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer ID or details (name and phone) must be provided.",
        )

    appt = Appointment(
        customer_id=customer_id,
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

    # 3. Send Confirmation Email if customer has an email and resend is configured
    if settings.resend_api_key:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if customer and customer.email:
            service = db.query(Service).filter(Service.id == payload.service_id).first()
            service_name = service.name if service else "Treatment"
            
            formatted_time = appt.appointment_time.strftime("%A, %B %d, %Y at %I:%M %p")
            
            html_content = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #111827; margin: 0;">Booking Confirmed</h2>
                </div>
                <p style="color: #374151; font-size: 16px;">Hi {customer.full_name},</p>
                <p style="color: #374151; font-size: 16px;">Thank you for booking with Beauty Intelligent Wellness. Your appointment has been confirmed!</p>
                
                <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Service</p>
                    <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">{service_name}</p>
                    
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Date & Time</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">{formatted_time}</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">We look forward to seeing you soon.</p>
            </div>
            """
            
            try:
                resend.Emails.send({
                    "from": "Beauty Intelligent Wellness <contact@biw.salon>",
                    "to": customer.email,
                    "subject": "Your Appointment is Confirmed! 📅",
                    "html": html_content
                })
            except Exception as e:
                print(f"Failed to send email: {e}")

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
