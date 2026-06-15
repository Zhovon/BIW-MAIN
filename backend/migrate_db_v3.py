import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    database_url = settings.database_url
    if not database_url:
        print("DATABASE_URL not found in settings.")
        return

    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    print(f"Connecting to {database_url}...")
    engine = create_engine(database_url)

    alter_statements = [
        "ALTER TABLE employees ADD COLUMN shift_start_time VARCHAR DEFAULT '10:00' NOT NULL;",
        "ALTER TABLE employees ADD COLUMN shift_end_time VARCHAR DEFAULT '19:00' NOT NULL;",
        "ALTER TABLE employees ADD COLUMN off_days VARCHAR DEFAULT 'Sunday' NOT NULL;",
        "ALTER TABLE employees ADD COLUMN treatment_commission_amount NUMERIC(10,2) DEFAULT 0.0 NOT NULL;"
    ]

    with engine.begin() as conn:
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
                print(f"Success: {stmt}")
            except Exception as e:
                print(f"Error or already exists: {stmt}\n  -> {e}")

    print("Migration V3 Complete!")

if __name__ == "__main__":
    run_migration()
