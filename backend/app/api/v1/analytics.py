from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract, and_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.clinic import Sale, SaleEmployee, Service, Customer, Employee, Branch

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/risk-dashboard")
def get_risk_dashboard_data(
    start_date: str = Query(...),
    end_date: str = Query(...),
    branch_id: Optional[str] = None,
    staff_name: Optional[str] = None,
    payment_method: Optional[str] = None,
    db: Session = Depends(get_db)
):
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

    # 3. Daily Revenue Trend
    daily_revenue_raw = db.query(
        func.date_trunc('day', Sale.created_at).label('day'),
        func.sum(Sale.sale_amount).label('revenue')
    ).select_from(sales_q.subquery()).group_by('day').all()

    daily_trend = {row.day.strftime("%Y-%m-%d"): float(row.revenue or 0) for row in daily_revenue_raw if row.day}

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

    # 8. Utilization Heatmap (Count per dow and hour)
    heatmap_raw = sales_q.with_entities(
        extract('dow', Sale.created_at).label('dow'),
        extract('hour', Sale.created_at).label('hour'),
        func.count(Sale.id).label('count')
    ).group_by('dow', 'hour').all()

    utilization_heatmap = []
    for row in heatmap_raw:
        pg_dow = int(row.dow)
        js_dow = 6 if pg_dow == 0 else pg_dow - 1
        utilization_heatmap.append({
            "dow": js_dow,
            "hour": int(row.hour),
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

    return {
        "revenue": total_revenue,
        "count": total_count,
        "avgTicket": total_revenue / total_count if total_count > 0 else 0,
        "payment": payment_mix,
        "daily": daily_trend,
        "hourly": hourly_demand,
        "weekday": weekday_demand,
        "band": ticket_bands,
        "staff_performance": staff_performance,
        "utilization_heatmap": utilization_heatmap,
        "vip_cohort": vip_cohort,
    }
