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
        "ALTER TABLE sales ADD COLUMN payment_method VARCHAR DEFAULT 'Cash' NOT NULL;"
    ]

    with engine.begin() as conn:
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
                print(f"Success: {stmt}")
            except Exception as e:
                print(f"Error or already exists: {stmt}\n  -> {e}")

    print("Migration V4 Complete!")

if __name__ == "__main__":
    run_migration()
