import os
import sys
import httpx
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from sqlalchemy import create_engine

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.models.clinic import Service

# Load .env from backend directory explicitly
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("[-] DATABASE_URL not found in .env")
    sys.exit(1)

# Ensure SQLAlchemy uses psycopg 3
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Use the token we captured!
SHOPIFY_TOKEN = os.getenv("SHOPIFY_TOKEN")
SHOPIFY_DOMAIN = "14a8vp-4w.myshopify.com"

if not SHOPIFY_TOKEN:
    print("[-] SHOPIFY_TOKEN not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def run_sync():
    print("[+] Connecting to Shopify Admin API...")
    url = f"https://{SHOPIFY_DOMAIN}/admin/api/2024-01/products.json?limit=250"
    headers = {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json"
    }

    response = httpx.get(url, headers=headers)
    if response.status_code != 200:
        print("[-] Failed to fetch products:", response.text)
        return

    products = response.json().get("products", [])
    
    # Filter for products tagged with 'Service' (case-insensitive check)
    services_to_sync = [
        p for p in products 
        if "service" in [tag.strip().lower() for tag in p.get("tags", "").split(",")]
    ]
    
    print(f"[+] Found {len(services_to_sync)} Shopify products tagged as 'Service'.")

    with Session(engine) as session:
        for p in services_to_sync:
            name = p.get("title")
            variants = p.get("variants", [])
            price = float(variants[0].get("price", 0)) if variants else 0.0

            # Match by name (case insensitive in python logic)
            existing_service = session.query(Service).filter(Service.name == name).first()
            
            if existing_service:
                print(f"  [~] Updating existing service: {name} (Price: {price})")
                existing_service.price = price
                existing_service.is_active = p.get("status") == "active"
            else:
                print(f"  [+] Creating new service: {name} (Price: {price})")
                new_service = Service(
                    name=name,
                    price=price,
                    cost=0.0,
                    is_active=p.get("status") == "active",
                    branch_id=None # Available to all branches by default
                )
                session.add(new_service)
        
        session.commit()
        print("[+] Sync complete! Database updated successfully.")

if __name__ == "__main__":
    run_sync()
