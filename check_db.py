import sys
from sqlalchemy import create_engine, text
import os

url = "postgresql://postgres.ljizybffylczdssnlbkj:2879658512%40Sh@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
engine = create_engine(url)

try:
    with engine.connect() as conn:
        print("Connected successfully!")
        
        # Get all tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public'
        """))
        tables = [row[0] for row in result]
        print("\nTables found in Supabase public schema:")
        
        for table in tables:
            try:
                count_res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = count_res.scalar()
                print(f"- {table}: {count} rows")
            except Exception as e:
                print(f"- {table}: Error reading count ({e})")
                
except Exception as e:
    print(f"Connection failed: {e}")
