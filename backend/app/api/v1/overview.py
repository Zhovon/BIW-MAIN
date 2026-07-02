from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.clinic import Branch, CostEntry, RevenueEntry, Sale
from app.schemas.clinic import (BranchChartEntry, DailyChartEntry,
                                DailyChartsRead, MonthlyChartEntry,
                                OverviewBranchRead, OverviewChartsRead,
                                OverviewRead)

router = APIRouter(prefix="/overview", tags=["overview"])


@router.get("", response_model=OverviewRead)
def owner_overview(db: Session = Depends(get_db)) -> OverviewRead:
    """
    Computes branch-level and system-wide financial summaries dynamically
    by aggregating live database entries for revenue and costs in optimized queries.
    """
    # 1. Fetch aggregated revenues per branch
    revenues_by_branch = (
        db.query(
            RevenueEntry.branch_id, func.sum(RevenueEntry.amount).label("total_revenue")
        )
        .group_by(RevenueEntry.branch_id)
        .all()
    )

    # 2. Fetch aggregated costs per branch
    costs_by_branch = (
        db.query(CostEntry.branch_id, func.sum(CostEntry.amount).label("total_costs"))
        .group_by(CostEntry.branch_id)
        .all()
    )

    # Build maps for lookup
    revenues_branch_map = {
        row.branch_id: float(row.total_revenue)
        for row in revenues_by_branch
        if row.branch_id
    }
    costs_branch_map = {
        row.branch_id: float(row.total_costs)
        for row in costs_by_branch
        if row.branch_id
    }

    db_branches = db.query(Branch).filter(Branch.is_active == True).all()
    branches_summary = []

    for branch in db_branches:
        revenue_val = revenues_branch_map.get(branch.id, 0.0)
        cost_val = costs_branch_map.get(branch.id, 0.0)
        profit_val = revenue_val - cost_val

        branches_summary.append(
            OverviewBranchRead(
                branch=branch.name,
                revenue=revenue_val,
                cost=cost_val,
                profit=profit_val,
            )
        )

    revenue_total = sum(b.revenue for b in branches_summary)
    cost_total = sum(b.cost for b in branches_summary)

    return OverviewRead(
        revenue_total=revenue_total,
        cost_total=cost_total,
        profit_total=revenue_total - cost_total,
        branches=branches_summary,
    )


@router.get("/financial-chart", response_model=OverviewChartsRead)
def get_financial_chart_data(db: Session = Depends(get_db)) -> OverviewChartsRead:
    """
    Returns aggregated monthly data for the past 6 months and branch-level totals.
    """
    base_date = datetime.now()
    start_date = (base_date - timedelta(days=180)).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    # 1. Fetch monthly aggregated sales
    sales_by_month = (
        db.query(
            func.date_trunc("month", Sale.created_at).label("month"),
            func.sum(Sale.sale_amount).label("total_sales"),
        )
        .filter(Sale.created_at >= start_date)
        .group_by("month")
        .all()
    )

    # 2. Fetch monthly aggregated revenues
    revenues_by_month = (
        db.query(
            func.date_trunc("month", RevenueEntry.created_at).label("month"),
            func.sum(RevenueEntry.amount).label("total_revenue"),
        )
        .filter(RevenueEntry.created_at >= start_date)
        .group_by("month")
        .all()
    )

    # 3. Fetch monthly aggregated costs
    costs_by_month = (
        db.query(
            func.date_trunc("month", CostEntry.created_at).label("month"),
            func.sum(CostEntry.amount).label("total_costs"),
        )
        .filter(CostEntry.created_at >= start_date)
        .group_by("month")
        .all()
    )

    # Create lookups using start-of-month date objects
    sales_map = {
        row.month.date().replace(day=1): float(row.total_sales)
        for row in sales_by_month
        if row.month
    }
    revenues_map = {
        row.month.date().replace(day=1): float(row.total_revenue)
        for row in revenues_by_month
        if row.month
    }
    costs_map = {
        row.month.date().replace(day=1): float(row.total_costs)
        for row in costs_by_month
        if row.month
    }

    monthly_trend = []
    # Build 6-month monthly trend list (oldest month first)
    for m in reversed(range(6)):
        year = base_date.year
        month_val = base_date.month - m
        while month_val <= 0:
            month_val += 12
            year -= 1

        target_date_only = datetime(year, month_val, 1).date()
        month_str = target_date_only.strftime("%B %Y")

        sales_sum = sales_map.get(target_date_only, 0.0)
        revenue_sum = revenues_map.get(target_date_only, 0.0)
        cost_sum = costs_map.get(target_date_only, 0.0)

        total_revenue_comp = revenue_sum + sales_sum

        monthly_trend.append(
            MonthlyChartEntry(
                month=month_str,
                sales=sales_sum,
                revenue=total_revenue_comp,
                costs=cost_sum,
            )
        )

    # 2. Branch comparison aggregates (total history)
    sales_by_branch = (
        db.query(Sale.branch_id, func.sum(Sale.sale_amount).label("total_sales"))
        .group_by(Sale.branch_id)
        .all()
    )

    revenues_by_branch = (
        db.query(
            RevenueEntry.branch_id, func.sum(RevenueEntry.amount).label("total_revenue")
        )
        .group_by(RevenueEntry.branch_id)
        .all()
    )

    costs_by_branch = (
        db.query(CostEntry.branch_id, func.sum(CostEntry.amount).label("total_costs"))
        .group_by(CostEntry.branch_id)
        .all()
    )

    sales_branch_map = {
        row.branch_id: float(row.total_sales)
        for row in sales_by_branch
        if row.branch_id
    }
    revenues_branch_map = {
        row.branch_id: float(row.total_revenue)
        for row in revenues_by_branch
        if row.branch_id
    }
    costs_branch_map = {
        row.branch_id: float(row.total_costs)
        for row in costs_by_branch
        if row.branch_id
    }

    branch_comparison = []
    db_branches = db.query(Branch).filter(Branch.is_active == True).all()

    for branch in db_branches:
        sales_sum = sales_branch_map.get(branch.id, 0.0)
        revenue_sum = revenues_branch_map.get(branch.id, 0.0)
        cost_sum = costs_branch_map.get(branch.id, 0.0)

        total_revenue_comp = revenue_sum + sales_sum

        branch_comparison.append(
            BranchChartEntry(
                branch=branch.name,
                sales=sales_sum,
                revenue=total_revenue_comp,
                costs=cost_sum,
                profit=total_revenue_comp - cost_sum,
            )
        )

    return OverviewChartsRead(
        monthly_trend=monthly_trend, branch_comparison=branch_comparison
    )


@router.get("/daily-chart", response_model=DailyChartsRead)
def get_daily_chart_data(
    branch_id: Optional[str] = None, db: Session = Depends(get_db)
) -> DailyChartsRead:
    """
    Returns day-by-day aggregates for the past 30 days in O(1) database roundtrips.
    """
    base_date = datetime.now()
    start_date = (base_date - timedelta(days=29)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # 1. Fetch sales grouped by day
    sales_q = db.query(
        func.date_trunc("day", Sale.created_at).label("day"),
        func.sum(Sale.sale_amount).label("total_sales"),
    ).filter(Sale.created_at >= start_date)
    if branch_id:
        sales_q = sales_q.filter(Sale.branch_id == branch_id)
    sales_by_day = sales_q.group_by("day").all()

    # 2. Fetch costs grouped by day
    costs_q = db.query(
        func.date_trunc("day", CostEntry.created_at).label("day"),
        func.sum(CostEntry.amount).label("total_costs"),
    ).filter(CostEntry.created_at >= start_date)
    if branch_id:
        costs_q = costs_q.filter(CostEntry.branch_id == branch_id)
    costs_by_day = costs_q.group_by("day").all()

    # Create lookups mapping Date -> Float
    sales_map = {
        row.day.date(): float(row.total_sales) for row in sales_by_day if row.day
    }
    costs_map = {
        row.day.date(): float(row.total_costs) for row in costs_by_day if row.day
    }

    daily_trend = []
    total_sales = 0.0
    total_costs = 0.0

    # Build 30-day daily trend list (oldest day first)
    for i in reversed(range(30)):
        target_date = base_date - timedelta(days=i)
        target_date_only = target_date.date()
        date_str = target_date.strftime("%d %b")

        sales_val = sales_map.get(target_date_only, 0.0)
        cost_val = costs_map.get(target_date_only, 0.0)
        profit_val = sales_val - cost_val

        total_sales += sales_val
        total_costs += cost_val

        daily_trend.append(
            DailyChartEntry(
                date=date_str,
                sales=sales_val,
                costs=cost_val,
                profit=profit_val,
            )
        )

    avg_daily_sales = total_sales / 30.0
    profit_margin = (
        ((total_sales - total_costs) / total_sales * 100.0) if total_sales > 0 else 0.0
    )

    return DailyChartsRead(
        daily_trend=daily_trend,
        average_daily_sales=avg_daily_sales,
        total_sales=total_sales,
        total_costs=total_costs,
        profit_margin=profit_margin,
    )


@router.get("/active-dates", response_model=list[str])
def get_active_dates(db: Session = Depends(get_db)):
    """
    Returns a unique list of YYYY-MM-DD strings indicating days with sales or costs,
    so the frontend calendar can render indicator dots instantly without downloading the entire database.
    """
    sales_dates = db.query(func.date(Sale.created_at)).distinct().all()
    costs_dates = db.query(func.date(CostEntry.created_at)).distinct().all()

    unique_dates = set()
    for (d,) in sales_dates:
        if d:
            unique_dates.add(str(d))
    for (d,) in costs_dates:
        if d:
            unique_dates.add(str(d))

    return sorted(list(unique_dates))
