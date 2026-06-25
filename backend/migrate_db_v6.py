import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, Base
from app.models.clinic import Appointment, DailyAdSpend

print("Creating new Appointment and DailyAdSpend tables in the database...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
