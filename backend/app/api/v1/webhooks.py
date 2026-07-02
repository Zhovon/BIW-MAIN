import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.clinic import Branch, CostEntry, Customer, DailyAdSpend, Sale
from app.schemas.clinic import DailyAdSpendCreate

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/shopify/orders")
async def shopify_order_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives an order/create webhook from Shopify.
    """
    payload = await request.json()

    # Extract customer info
    customer_data = payload.get("customer", {})
    email = customer_data.get("email") or payload.get("email")
    phone = customer_data.get("phone", "0000000000")
    first_name = customer_data.get("first_name", "")
    last_name = customer_data.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or "Online Customer"

    total_price = float(payload.get("total_price", 0.0))

    if total_price <= 0:
        return {"status": "ignored", "reason": "Zero value order"}

    # 1. Find or create Customer by phone or email
    customer = None
    if phone and phone != "0000000000":
        customer = db.query(Customer).filter(Customer.phone == phone).first()
    if not customer and email:
        customer = db.query(Customer).filter(Customer.email == email).first()

    if not customer:
        customer = Customer(
            id=str(uuid.uuid4()),
            full_name=full_name,
            phone=phone,
            email=email,
            notes="Created automatically via Shopify Store Webhook",
        )
        db.add(customer)
        db.flush()

    # 2. Get a default branch_id (the first active branch) to assign the online sale to
    branch = db.query(Branch).filter(Branch.is_active == True).first()
    branch_id = branch.id if branch else None

    # 3. Create Sale record
    sale = Sale(
        branch_id=branch_id,
        customer_id=customer.id,
        sale_amount=total_price,
        payment_method="Online (Shopify)",
    )
    db.add(sale)
    db.commit()

    return {"status": "success", "sale_id": sale.id}


@router.post("/shopify/products")
async def shopify_product_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives a product/create or product/update webhook from Shopify.
    Upserts the product into the Services table if it is tagged as a 'Service'.
    """
    payload = await request.json()

    # Shopify sends the product JSON as the payload
    tags_str = payload.get("tags", "")
    tags = [tag.strip().lower() for tag in tags_str.split(",")]
    
    if "service" not in tags:
        return {"status": "ignored", "reason": "Not a service"}

    name = payload.get("title")
    variants = payload.get("variants", [])
    price = float(variants[0].get("price", 0)) if variants else 0.0
    is_active = payload.get("status") == "active"

    from app.models.clinic import Service
    
    # Match by exact name
    service = db.query(Service).filter(Service.name == name).first()
    
    if service:
        service.price = price
        service.is_active = is_active
    else:
        service = Service(
            name=name,
            price=price,
            cost=0.0,
            is_active=is_active,
            branch_id=None
        )
        db.add(service)
        
    db.commit()
    return {"status": "success", "service_name": name, "price": price}


@router.post("/marketing/spend", status_code=201)
def marketing_spend_webhook(payload: DailyAdSpendCreate, db: Session = Depends(get_db)):
    """
    Receives daily ad spend from Zapier/Make.com.
    """
    # 1. Record the daily spend for analytics
    ad_spend = DailyAdSpend(
        date=payload.date,
        platform=payload.platform,
        amount_spent=payload.amount_spent,
        impressions=payload.impressions,
        clicks=payload.clicks,
    )
    db.add(ad_spend)

    # 2. Automatically inject this into the global CostEntry for Profit/Loss tracking
    branch = db.query(Branch).filter(Branch.is_active == True).first()

    cost_entry = CostEntry(
        branch_id=branch.id if branch else None,
        cost_type="Marketing/Ads",
        amount=payload.amount_spent,
        note=f"Automated spend log from {payload.platform} for {payload.date}",
    )
    db.add(cost_entry)

    db.commit()

    return {"status": "success", "recorded_amount": payload.amount_spent}
