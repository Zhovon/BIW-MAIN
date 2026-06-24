import psycopg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

conn = psycopg.connect(os.environ["DATABASE_URL"])
conn.execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS uid SERIAL;")
conn.commit()
conn.close()
print("Added UID column to customers table")
