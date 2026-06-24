from app.db.session import SessionLocal
from app.models.clinic import Employee
db = SessionLocal()
emp = db.query(Employee).filter(Employee.user_id == 'd98c64b6-e3b5-4bcd-aedd-c869cfcfd86f').first()
print('Employee found:', emp is not None)
if emp:
    print('Role:', emp.role)
else:
    # Also check if there are ANY employees
    count = db.query(Employee).count()
    print('Total employees in DB:', count)
    manager = db.query(Employee).filter(Employee.role.ilike('%manager%')).first()
    if manager:
        print('Manager found with user_id:', manager.user_id)
