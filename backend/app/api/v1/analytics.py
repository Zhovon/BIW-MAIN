from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract, and_
from sqlalchemy.orm import Session
from cachetools import cached, TTLCache

from app.db.session import get_db
from app.models.clinic import Sale, SaleEmployee, Service, Customer, Employee, Branch, BranchTarget

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Cache analytics calculations for 5 minutes to prevent DB bottleneck
analytics_cache = TTLCache(maxsize=100, ttl=300)

@router.get("/risk-dashboard")
def get_risk_dashboard_data(
    start_date: str = Query(...),
    end_date: str = Query(...),
    branch_id: Optional[str] = None,
    staff_name: Optional[str] = None,
    payment_method: Optional[str] = None,
    ticket_band: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"risk_{start_date}_{end_date}_{branch_id}_{staff_name}_{payment_method}_{ticket_band}"
    if cache_key in analytics_cache:
        return analytics_cache[cache_key]

    """
    Returns aggregated data for the Risk-Coded Owner Dashboard.
    Performs grouping in PostgreSQL to avoid memory overload.
    """
    try:
        start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    except Exception:
        # Fallback format
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")

    # Base query for Sales
    sales_q = db.query(Sale).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt
    )

    if branch_id:
        sales_q = sales_q.filter(Sale.branch_id == branch_id)
    if payment_method:
        sales_q = sales_q.filter(Sale.payment_method == payment_method)
    
    if ticket_band:
        if ticket_band == "10k+": sales_q = sales_q.filter(Sale.sale_amount >= 10000)
        elif ticket_band == "5k-10k": sales_q = sales_q.filter(Sale.sale_amount >= 5000, Sale.sale_amount < 10000)
        elif ticket_band == "2.5k-5k": sales_q = sales_q.filter(Sale.sale_amount >= 2500, Sale.sale_amount < 5000)
        elif ticket_band == "1k-2.5k": sales_q = sales_q.filter(Sale.sale_amount >= 1000, Sale.sale_amount < 2500)
        elif ticket_band == "500-1k": sales_q = sales_q.filter(Sale.sale_amount >= 500, Sale.sale_amount < 1000)
        elif ticket_band == "0-500": sales_q = sales_q.filter(Sale.sale_amount >= 0, Sale.sale_amount < 500)
    
    # Optional staff filter
    if staff_name:
        sales_q = sales_q.join(Sale.assigned_employees).join(SaleEmployee.employee).filter(
            Employee.full_name == staff_name
        )

    # 1. Total Revenue and Transaction Count
    overview = db.query(
        func.sum(Sale.sale_amount).label('revenue'),
        func.count(Sale.id).label('count')
    ).select_from(sales_q.subquery()).first()
    
    total_revenue = float(overview.revenue or 0)
    total_count = int(overview.count or 0)

    # 2. Payment Mix
    payment_mix_raw = db.query(
        Sale.payment_method,
        func.sum(Sale.sale_amount).label('amount')
    ).select_from(sales_q.subquery()).group_by(Sale.payment_method).all()
    
    payment_mix = {row.payment_method: float(row.amount or 0) for row in payment_mix_raw}

    # 3. Daily Revenue (Selected Period)
    daily_revenue_raw = sales_q.with_entities(
        func.date(Sale.created_at).label('date'),
        func.sum(Sale.sale_amount).label('revenue')
    ).group_by(func.date(Sale.created_at)).all()

    # Pad with all dates in range
    daily_revenue = {}
    curr = start_dt
    while curr.date() <= end_dt.date():
        daily_revenue[curr.strftime("%Y-%m-%d")] = 0.0
        curr += timedelta(days=1)
    
    for row in daily_revenue_raw:
        daily_revenue[str(row.date)] = float(row.revenue or 0)


    # 3b. Daily Revenue (Previous Period)
    period_delta = end_dt - start_dt
    prev_start_dt = start_dt - period_delta
    prev_end_dt = start_dt
    
    prev_sales_q = db.query(Sale).filter(
        Sale.created_at >= prev_start_dt,
        Sale.created_at < prev_end_dt
    )
    prev_daily_raw = prev_sales_q.with_entities(
        func.date(Sale.created_at).label('date'),
        func.sum(Sale.sale_amount).label('revenue')
    ).group_by(func.date(Sale.created_at)).all()
    # Pad with all dates in previous range
    prev_daily_revenue = {}
    curr = prev_start_dt
    while curr.date() < prev_end_dt.date():
        prev_daily_revenue[curr.strftime("%Y-%m-%d")] = 0.0
        curr += timedelta(days=1)
        
    for row in prev_daily_raw:
        prev_daily_revenue[str(row.date)] = float(row.revenue or 0)


    # 3c. Visit Frequency (Count of visits per customer)
    visit_counts = sales_q.with_entities(
        Sale.customer_id,
        func.count(Sale.id).label('visits')
    ).group_by(Sale.customer_id).all()
    
    visit_frequency = {"1 visit": 0, "2 visits": 0, "3+ visits": 0}
    for row in visit_counts:
        v = row.visits
        if v == 1: visit_frequency["1 visit"] += 1
        elif v == 2: visit_frequency["2 visits"] += 1
        elif v >= 3: visit_frequency["3+ visits"] += 1

    # 4. Hourly Demand (Services per hour)
    hourly_demand_raw = db.query(
        extract('hour', Sale.created_at).label('hour'),
        func.count(Sale.id).label('count')
    ).select_from(sales_q.subquery()).group_by('hour').all()

    hourly_demand = {int(row.hour): int(row.count or 0) for row in hourly_demand_raw}

    # 5. Weekday Demand (Services per weekday)
    # SQLAlchemy extract('dow') returns 0-6 (Sun-Sat). HTML expects Mon=0, Sun=6.
    # postgresql dow: 0=Sun, 1=Mon, ..., 6=Sat
    weekday_demand_raw = db.query(
        extract('dow', Sale.created_at).label('dow'),
        func.count(Sale.id).label('count')
    ).select_from(sales_q.subquery()).group_by('dow').all()

    weekday_demand = {}
    for row in weekday_demand_raw:
        pg_dow = int(row.dow)
        # Convert to JS ISO standard (0=Mon, 6=Sun)
        js_dow = 6 if pg_dow == 0 else pg_dow - 1
        weekday_demand[js_dow] = int(row.count or 0)

    # 6. Ticket Size Bands
    # We will compute the bands manually based on the raw sales to keep it simple, 
    # but ideally we do a CASE WHEN in postgres. For speed, let's just group by amount.
    bands_raw = db.query(Sale.sale_amount).select_from(sales_q.subquery()).all()
    ticket_bands = {"0-500": 0, "500-1k": 0, "1k-2.5k": 0, "2.5k-5k": 0, "5k-10k": 0, "10k+": 0}
    for (amount,) in bands_raw:
        a = float(amount or 0)
        if a <= 500: ticket_bands["0-500"] += 1
        elif a <= 1000: ticket_bands["500-1k"] += 1
        elif a <= 2500: ticket_bands["1k-2.5k"] += 1
        elif a <= 5000: ticket_bands["2.5k-5k"] += 1
        elif a <= 10000: ticket_bands["5k-10k"] += 1
        else: ticket_bands["10k+"] += 1

    # 7. Staff Performance (Revenue & Count per Employee)
    staff_perf_raw = sales_q.join(Sale.assigned_employees).join(Employee, Employee.id == SaleEmployee.employee_id).with_entities(
        Employee.full_name,
        func.sum(Sale.sale_amount).label('revenue'),
        func.count(Sale.id).label('count')
    ).group_by(Employee.full_name).all()
     
    staff_performance = [
        {"name": row.full_name, "revenue": float(row.revenue or 0), "count": int(row.count or 0)}
        for row in staff_perf_raw
    ]
    staff_performance.sort(key=lambda x: x["revenue"], reverse=True)

    # 8. Utilization Heatmap (Count per dow, hour, staff)
    heatmap_raw = sales_q.join(Sale.assigned_employees).join(Employee, Employee.id == SaleEmployee.employee_id).with_entities(
        extract('dow', Sale.created_at).label('dow'),
        extract('hour', Sale.created_at).label('hour'),
        Employee.full_name.label('staff_name'),
        func.count(Sale.id).label('count')
    ).group_by('dow', 'hour', Employee.full_name).all()

    utilization_heatmap = []
    for row in heatmap_raw:
        pg_dow = int(row.dow)
        js_dow = 6 if pg_dow == 0 else pg_dow - 1
        utilization_heatmap.append({
            "dow": js_dow,
            "hour": int(row.hour),
            "staff_name": row.staff_name,
            "count": int(row.count or 0)
        })

    # 9. VIP Cohort (Top customers by revenue in period)
    vip_raw = sales_q.join(Customer, Customer.id == Sale.customer_id).with_entities(
        Customer.full_name,
        Customer.phone,
        func.sum(Sale.sale_amount).label('revenue'),
        func.count(Sale.id).label('visits')
    ).group_by(Customer.id, Customer.full_name, Customer.phone)\
     .order_by(func.sum(Sale.sale_amount).desc())\
     .limit(20).all()

    vip_cohort = [
        {
            "name": row.full_name,
            "phone": row.phone,
            "revenue": float(row.revenue or 0),
            "visits": int(row.visits or 0)
        } for row in vip_raw
    ]

    # 10. Snapshot Data
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    last_week_start = today_start - timedelta(days=7)
    
    snapshot_q = db.query(Sale)
    if branch_id:
        snapshot_q = snapshot_q.filter(Sale.branch_id == branch_id)
        
    today_stats = snapshot_q.filter(Sale.created_at >= today_start).with_entities(func.sum(Sale.sale_amount), func.count(Sale.id)).first()
    yesterday_stats = snapshot_q.filter(Sale.created_at >= yesterday_start, Sale.created_at < today_start).with_entities(func.sum(Sale.sale_amount), func.count(Sale.id)).first()
    last_week_stats = snapshot_q.filter(Sale.created_at >= last_week_start, Sale.created_at < last_week_start + timedelta(days=1)).with_entities(func.sum(Sale.sale_amount)).first()
    
    trailing_revs = []
    for i in range(1, 5):
        d_start = today_start - timedelta(days=7*i)
        d_end = d_start + timedelta(days=1)
        r = snapshot_q.filter(Sale.created_at >= d_start, Sale.created_at < d_end).with_entities(func.sum(Sale.sale_amount)).scalar()
        trailing_revs.append(r or 0)
    
    trailing_avg = sum(trailing_revs) / 4 if trailing_revs else 0
    
    # 5. Target Run-Rate
    month_str = f"{end_dt.year}-{end_dt.month:02d}"
    target_q = db.query(BranchTarget).filter(BranchTarget.month == month_str)
    if branch_id and branch_id != "all":
        target_q = target_q.filter(BranchTarget.branch_id == branch_id)
    
    targets = target_q.all()
    target_amount = sum(float(t.target_amount) for t in targets)
    target_run_rate = (total_revenue / target_amount * 100) if target_amount > 0 else 0

    snapshot = {
        "today_rev": float(today_stats[0] or 0) if today_stats else 0,
        "today_count": int(today_stats[1] or 0) if today_stats else 0,
        "yesterday_rev": float(yesterday_stats[0] or 0) if yesterday_stats else 0,
        "yesterday_count": int(yesterday_stats[1] or 0) if yesterday_stats else 0,
        "last_week_rev": float(last_week_stats[0] or 0) if last_week_stats else 0,
        "trailing_avg": float(trailing_avg)
    }

    result = {
        "revenue": total_revenue,
        "count": total_count,
        "avgTicket": total_revenue / total_count if total_count > 0 else 0,
        "daily": daily_revenue,
        "prev_daily": prev_daily_revenue,
        "payment_methods": payment_mix,
        "staff_performance": staff_performance,
        "hourly_demand": hourly_demand,
        "weekday_demand": weekday_demand,
        "ticket_sizes": ticket_bands,
        "vip_cohort": vip_cohort,
        "target_amount": target_amount,
        "target_run_rate": target_run_rate
    }
    analytics_cache[cache_key] = result
    return result
