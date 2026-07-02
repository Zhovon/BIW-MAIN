# pyrefly: ignore [missing-import]
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.clinic import (Branch, CostEntry, Customer, Employee,
                               PayrollRun, RevenueEntry, Sale, SaleEmployee,
                               Service, ServiceAssignment)

router = APIRouter(prefix="/health", tags=["health"])


@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_database(db: Session = Depends(get_db)):
    """
    Seeds the database with initial branch operations data, employees, services,
    and revenue/cost entries for local development and testing.
    """
    if settings.environment != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seeding is only allowed in development environment.",
        )

    try:
        # 1. Clean existing records in reverse dependency order
        db.query(PayrollRun).delete()
        db.query(SaleEmployee).delete()
        db.query(Sale).delete()
        db.query(Customer).delete()
        db.query(ServiceAssignment).delete()
        db.query(RevenueEntry).delete()
        db.query(CostEntry).delete()
        db.query(Service).delete()
        db.query(Employee).delete()
        db.query(Branch).delete()
        db.commit()

        # 2. Seed Branches
        branches = [
            Branch(
                id="branch-1",
                name="Bashundhara Central",
                city="Dhaka",
                address="Block D, Bashundhara R/A, Dhaka",
                is_active=True,
            ),
            Branch(
                id="branch-2",
                name="Dhanmondi Studio",
                city="Dhaka",
                address="Road 27, Dhanmondi, Dhaka",
                is_active=True,
            ),
            Branch(
                id="branch-3",
                name="Gulshan Lounge",
                city="Dhaka",
                address="Madani Ave, Gulshan, Dhaka",
                is_active=True,
            ),
        ]
        for b in branches:
            db.add(b)
        db.commit()

        # Ensure we have a Supabase client to sync Auth users
        supabase_client = None
        if settings.supabase_url and settings.supabase_service_role_key:
            from supabase import create_client

            supabase_client = create_client(
                settings.supabase_url, settings.supabase_service_role_key
            )

        def sync_user(email: str, password: str, role: str) -> Optional[str]:
            if not supabase_client:
                return None
            try:
                # Check list of users
                users_resp = supabase_client.auth.admin.list_users()
                users = users_resp.users if hasattr(users_resp, "users") else users_resp
                for u in users:
                    if u.email == email:
                        # Update user password & metadata
                        supabase_client.auth.admin.update_user_by_id(
                            u.id,
                            {"password": password, "user_metadata": {"role": role}},
                        )
                        return u.id
                # Create user
                res = supabase_client.auth.admin.create_user(
                    {
                        "email": email,
                        "password": password,
                        "user_metadata": {"role": role},
                        "email_confirm": True,
                    }
                )
                if hasattr(res, "user") and res.user:
                    return res.user.id
                elif isinstance(res, dict) and "user" in res:
                    return res["user"]["id"]
                else:
                    return res.id
            except Exception as e:
                print(f"Failed to sync user {email} to Supabase: {e}")
                return None

        # Seed owner account
        sync_user("admin@zhovon.com", "aspirine", "owner")

        # Seed employee accounts
        amina_uid = sync_user("amina@zhovon.com", "amina123", "employee")
        nadia_uid = sync_user("nadia@zhovon.com", "nadia123", "manager")
        shahin_uid = sync_user("shahin@zhovon.com", "shahin123", "employee")

        # 3. Seed Employees
        employees = [
            Employee(
                id="employee-1",
                branch_id="branch-1",
                full_name="Amina Rahman",
                role="Senior Therapist",
                salary=32000,
                bonus_rate=8,
                commission_rate=4,
                email="amina@zhovon.com",
                user_id=amina_uid,
            ),
            Employee(
                id="employee-2",
                branch_id="branch-1",
                full_name="Nadia Sultana",
                role="Front Desk Manager",
                salary=28000,
                bonus_rate=5,
                commission_rate=2,
                email="nadia@zhovon.com",
                user_id=nadia_uid,
            ),
            Employee(
                id="employee-3",
                branch_id="branch-2",
                full_name="Shahin Ahmed",
                role="Branch Coordinator",
                salary=30000,
                bonus_rate=6,
                commission_rate=3,
                email="shahin@zhovon.com",
                user_id=shahin_uid,
            ),
        ]
        for emp in employees:
            db.add(emp)
        db.commit()

        # 4. Seed Services
        services = [
            Service(
                id="service-1",
                branch_id="branch-1",
                name="Hydra Facial",
                price=6500,
                cost=2500,
            ),
            Service(
                id="service-2",
                branch_id="branch-1",
                name="Laser Hair Removal",
                price=9000,
                cost=3800,
            ),
            Service(
                id="service-3",
                branch_id="branch-2",
                name="Skin Consultation",
                price=2500,
                cost=900,
            ),
        ]
        for s in services:
            db.add(s)
        db.commit()

        # 5. Seed Service Assignments
        assignments = [
            ServiceAssignment(
                id="assignment-1",
                service_id="service-1",
                employee_id="employee-1",
                bonus_amount=300,
            ),
            ServiceAssignment(
                id="assignment-2",
                service_id="service-2",
                employee_id="employee-1",
                bonus_amount=450,
            ),
            ServiceAssignment(
                id="assignment-3",
                service_id="service-3",
                employee_id="employee-3",
            ),
        ]
        for a in assignments:
            db.add(a)
        db.commit()

        # 6. Seed Customers
        customers = [
            Customer(
                id="customer-1",
                full_name="John Doe",
                phone="+8801811111111",
                email="john@gmail.com",
                notes="Regular client",
            ),
            Customer(
                id="customer-2",
                full_name="Jane Smith",
                phone="+8801822222222",
                email="jane@gmail.com",
            ),
            Customer(
                id="customer-3",
                full_name="Robert Downey",
                phone="+8801833333333",
                email="tony@stark.com",
                notes="VVIP",
            ),
            Customer(
                id="customer-4",
                full_name="Taylor Swift",
                phone="+8801844444444",
                email="taylor@music.com",
            ),
            Customer(
                id="customer-5",
                full_name="Selena Gomez",
                phone="+8801855555555",
                email="selena@instagram.com",
            ),
        ]
        for cust in customers:
            db.add(cust)
        db.commit()

        # Add a service for Branch 3 (Gulshan Lounge)
        db.add(
            Service(
                id="service-4",
                branch_id="branch-3",
                name="Laser Brightening",
                price=12000,
                cost=4500,
            )
        )
        db.commit()

        # Ensure active testing users exist as Employee profiles
        db.add(
            Employee(
                id="employee-manager-user",
                branch_id="branch-1",
                full_name="Shahadath Hossain",
                role="Branch Manager",
                salary=45000,
                bonus_rate=10,
                commission_rate=5,
                email="shahadathossain287@hotmail.com",
                user_id="d98c64b6-e3b5-4bcd-aedd-c869cfcfd86f",
                is_active=True,
            )
        )
        db.commit()

        import random
        from datetime import timedelta

        # Fetch active services and employees
        all_services = db.query(Service).all()
        branch_services = {}
        for s in all_services:
            branch_services.setdefault(s.branch_id, []).append(s)

        all_employees = db.query(Employee).filter(Employee.is_active == True).all()
        branch_employees = {}
        for e in all_employees:
            branch_employees.setdefault(e.branch_id, []).append(e)

        base_date = datetime.now()

        # Seed Daily Sales and Daily Costs for the last 30 days
        for i in range(30):
            day_date = base_date - timedelta(days=i)
            for branch_id in ["branch-1", "branch-2", "branch-3"]:
                services_list = branch_services.get(branch_id, [])
                employees_list = branch_employees.get(branch_id, [])
                if not services_list or not employees_list:
                    continue

                # Number of sales on this day
                num_sales = random.randint(1, 3)
                for _ in range(num_sales):
                    srv = random.choice(services_list)
                    cust = random.choice(customers)
                    discount = random.choice([0.0, 0.0, 200.0, 500.0])
                    sale_amount = float(srv.price) - discount

                    sale_time = day_date.replace(
                        hour=random.randint(9, 20), minute=random.randint(0, 59)
                    )
                    sale = Sale(
                        branch_id=branch_id,
                        service_id=srv.id,
                        employee_id=employees_list[0].id,
                        customer_id=cust.id,
                        sale_amount=sale_amount,
                        discount_amount=discount,
                        created_at=sale_time,
                    )
                    db.add(sale)
                    db.flush()

                    # Junction table mapping
                    num_emps = min(len(employees_list), random.randint(1, 2))
                    assigned_emps = random.sample(employees_list, num_emps)
                    for emp in assigned_emps:
                        db.add(
                            SaleEmployee(
                                sale_id=sale.id,
                                employee_id=emp.id,
                                created_at=sale_time,
                            )
                        )

                # Daily cost entry
                daily_cost_amount = random.randint(1500, 6000)
                daily_cost_time = day_date.replace(
                    hour=random.randint(9, 18), minute=random.randint(0, 59)
                )
                db.add(
                    CostEntry(
                        branch_id=branch_id,
                        cost_type=(
                            "Medical Supplies" if random.random() > 0.4 else "Marketing"
                        ),
                        amount=daily_cost_amount,
                        note="Daily clinical operational supplies",
                        created_at=daily_cost_time,
                    )
                )

        # Seed Monthly Revenue and Cost entries for the last 6 months
        for m in range(6):
            month_date = base_date - timedelta(days=m * 30)
            for branch_id in ["branch-1", "branch-2", "branch-3"]:
                # Monthly Revenues
                revenue_sources = [
                    ("Service Sales", random.randint(500000, 900000)),
                    ("Product Retail", random.randint(80000, 200000)),
                    ("Membership Packages", random.randint(150000, 300000)),
                ]
                for source, amt in revenue_sources:
                    db.add(
                        RevenueEntry(
                            branch_id=branch_id,
                            source=source,
                            amount=amt,
                            created_at=month_date,
                        )
                    )

                # Monthly Costs
                costs_breakdown = [
                    ("Rent & Utilities", random.randint(120000, 250000)),
                    ("Medical Supplies", random.randint(80000, 160000)),
                    ("Marketing", random.randint(25000, 60000)),
                ]
                for cost_type, amt in costs_breakdown:
                    db.add(
                        CostEntry(
                            branch_id=branch_id,
                            cost_type=cost_type,
                            amount=amt,
                            note="Monthly corporate allocated cost",
                            created_at=month_date,
                        )
                    )

        db.commit()

        return {"message": "Database successfully seeded with clean test data."}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database seeding failed: {str(e)}",
        )
