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
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;",
        "CREATE INDEX IF NOT EXISTS ix_services_branch_id ON services (branch_id);",
        "CREATE INDEX IF NOT EXISTS ix_services_created_at ON services (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_service_assignments_created_at ON service_assignments (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_customers_created_at ON customers (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_sales_branch_id ON sales (branch_id);",
        "CREATE INDEX IF NOT EXISTS ix_sales_created_at ON sales (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_sale_employees_created_at ON sale_employees (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_revenue_entries_branch_id ON revenue_entries (branch_id);",
        "CREATE INDEX IF NOT EXISTS ix_revenue_entries_created_at ON revenue_entries (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_cost_entries_branch_id ON cost_entries (branch_id);",
        "CREATE INDEX IF NOT EXISTS ix_cost_entries_created_at ON cost_entries (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_payroll_runs_branch_id ON payroll_runs (branch_id);",
        "CREATE INDEX IF NOT EXISTS ix_payroll_runs_month ON payroll_runs (month);",
        "CREATE INDEX IF NOT EXISTS ix_payroll_runs_created_at ON payroll_runs (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_branch_targets_branch_id ON branch_targets (branch_id);",
        "CREATE INDEX IF NOT EXISTS ix_branch_targets_month ON branch_targets (month);",
        "CREATE INDEX IF NOT EXISTS ix_branch_targets_created_at ON branch_targets (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_attendance_records_date ON attendance_records (date);",
        "CREATE INDEX IF NOT EXISTS ix_attendance_records_created_at ON attendance_records (created_at);"
    ]

    with engine.begin() as conn:
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
                print(f"Success: {stmt}")
            except Exception as e:
                print(f"Error or already exists: {stmt}\n  -> {e}")

    print("Migration V5 Complete!")

if __name__ == "__main__":
    run_migration()
