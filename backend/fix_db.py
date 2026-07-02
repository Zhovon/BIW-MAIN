import sys
import os

# Add the backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from sqlalchemy import text
from app.db.session import engine

def main():
    print("Dropping NOT NULL constraint on appointments.employee_id...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE appointments ALTER COLUMN employee_id DROP NOT NULL;"))
        conn.commit()
    print("Successfully altered table!")

if __name__ == "__main__":
    main()
