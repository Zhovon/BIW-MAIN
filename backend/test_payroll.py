from app.db.session import SessionLocal
from app.models.clinic import Employee
from app.api.v1.payroll import calculate_employee_earnings
db = SessionLocal()
emp = db.query(Employee).filter(Employee.user_id == 'd98c64b6-e3b5-4bcd-aedd-c869cfcfd86f').first()
print('Employee found:', emp is not None)
try:
    res = calculate_employee_earnings(db, emp, 2026, 6)
    print("Success!", res)
except Exception as e:
    import traceback
    traceback.print_exc()
