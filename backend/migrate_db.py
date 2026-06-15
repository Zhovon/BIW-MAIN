from app.db.session import engine, Base
from app.models.clinic import BranchTarget, AttendanceRecord, CustomerReview

print("Creating new tables in the database...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
