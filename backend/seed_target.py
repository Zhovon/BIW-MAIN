from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.clinic import BranchTarget
import datetime

# Use standard postgres URI matching the project
engine = create_engine("postgresql://postgres:postgres@localhost:5432/biw_main")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Delete old targets for branch-1
db.query(BranchTarget).filter(BranchTarget.branch_id == "branch-1").delete()

# Create a target for the current month
now = datetime.datetime.now()
month_str = f"{now.year}-{now.month:02d}"

target = BranchTarget(
    branch_id="branch-1",
    month=month_str,
    target_amount=1500000.00
)
db.add(target)
db.commit()
print(f"Seeded BranchTarget of 1,500,000 for {month_str}")
