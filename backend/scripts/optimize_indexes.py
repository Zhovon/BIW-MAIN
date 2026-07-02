import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def main():
    if not settings.database_url:
        print("DATABASE_URL not set!")
        return

    database_url = settings.database_url.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )
    engine = create_engine(database_url)

    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Creating performance indexes...")
        
        # Add index on customers phone for fast lookups during booking
        conn.execute(text("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_customers_phone ON customers (phone);"))
        
        # Add index on customers email
        conn.execute(text("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_customers_email ON customers (email);"))
        
        # Ensure appointments have covering indexes for manager dashboard queries
        conn.execute(text("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_appointments_branch_date ON appointments (branch_id, appointment_time);"))
        
        # Commit the transaction (though CREATE INDEX CONCURRENTLY cannot run in a transaction block usually, SQLAlchemy autocommit might handle it or we use execution_options)
        
        print("Indexes created successfully!")

if __name__ == "__main__":
    # In psycopg, CREATE INDEX CONCURRENTLY must be run outside of a transaction block
    main()
