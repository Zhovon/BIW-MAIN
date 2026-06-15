from app.db.session import engine
from sqlalchemy import text

print("Altering tables in the database...")
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS clock_in_time TIMESTAMP WITH TIME ZONE"))
    conn.execute(text("ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS clock_out_time TIMESTAMP WITH TIME ZONE"))
    conn.execute(text("ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS overtime_minutes INTEGER NOT NULL DEFAULT 0"))

print("Tables altered successfully!")
