from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.clinic import list_employees
from app.db.session import get_db
from app.models.clinic import Employee
from app.schemas.clinic import EmployeeCreate, EmployeeRead

router = APIRouter(prefix="/employees", tags=["employees"])

# Initialize Supabase client
supabase_client = None
if settings.supabase_url and settings.supabase_service_role_key:
    from supabase import create_client
    supabase_client = create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("", response_model=list[EmployeeRead])
def get_employees(db: Session = Depends(get_db)):
    return list_employees(db)


@router.post("", response_model=EmployeeRead, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)) -> Employee:
    user_id = None

    # 1. Create user in Supabase Auth if email and password are provided
    if payload.email and payload.password:
        if not supabase_client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase client is not configured on the backend.",
            )
        try:
            # Check if user already exists
            try:
                users_resp = supabase_client.auth.admin.list_users()
                users = users_resp.users if hasattr(users_resp, 'users') else users_resp
                for u in users:
                    if u.email == payload.email:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"User with email {payload.email} already exists in Supabase.",
                        )
            except HTTPException:
                raise
            except Exception as e:
                print(f"Error checking users: {e}")

            # Map metadata roles
            meta_role = "employee"
            role_lower = payload.role.lower()
            if "manager" in role_lower or "owner" in role_lower:
                meta_role = "manager"

            res = supabase_client.auth.admin.create_user(
                {
                    "email": payload.email,
                    "password": payload.password,
                    "user_metadata": {"role": meta_role},
                    "email_confirm": True,
                }
            )

            if hasattr(res, "user") and res.user:
                user_id = res.user.id
            elif isinstance(res, dict) and "user" in res:
                user_id = res["user"]["id"]
            else:
                user_id = res.id

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create user in Supabase: {str(e)}",
            )

    # 2. Insert employee record
    employee = Employee(
        branch_id=payload.branch_id,
        full_name=payload.full_name,
        role=payload.role,
        salary=payload.salary,
        bonus_rate=payload.bonus_rate,
        commission_rate=payload.commission_rate,
        email=payload.email,
        user_id=user_id,
    )
    db.add(employee)
    try:
        db.commit()
        db.refresh(employee)
    except Exception as e:
        db.rollback()
        # Clean up Supabase user if database insert fails
        if user_id and supabase_client:
            try:
                supabase_client.auth.admin.delete_user(user_id)
            except Exception as cleanup_err:
                print(f"Cleanup of Supabase user {user_id} failed: {cleanup_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save employee to database: {str(e)}",
        )

    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    # 1. Delete from Supabase Auth if linked
    if employee.user_id and supabase_client:
        try:
            supabase_client.auth.admin.delete_user(employee.user_id)
        except Exception as e:
            print(f"Failed to delete user {employee.user_id} from Supabase: {e}")

    # 2. Delete from database
    try:
        db.delete(employee)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete employee from database: {str(e)}",
        )
