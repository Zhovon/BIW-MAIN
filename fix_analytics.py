with open("backend/app/api/v1/analytics.py", "r") as f:
    content = f.read()

import_addition = """from datetime import datetime, timedelta
"""

# Let's see if timedelta is imported.
if "from datetime import" in content and "timedelta" not in content:
    content = content.replace("from datetime import datetime", "from datetime import datetime, timedelta")
elif "timedelta" not in content:
    content = "from datetime import timedelta\n" + content

# We need to replace the daily_revenue creation logic.
target_daily = """    daily_revenue = {str(row.date): float(row.revenue or 0) for row in daily_revenue_raw}"""

replacement_daily = """    # Pad with all dates in range
    daily_revenue = {}
    curr = start_dt
    while curr < end_dt:
        daily_revenue[curr.strftime("%Y-%m-%d")] = 0.0
        curr += timedelta(days=1)
    
    for row in daily_revenue_raw:
        daily_revenue[str(row.date)] = float(row.revenue or 0)
"""

target_prev_daily = """    prev_daily_revenue = {str(row.date): float(row.revenue or 0) for row in prev_daily_raw}"""

replacement_prev_daily = """    # Pad with all dates in previous range
    prev_daily_revenue = {}
    curr = prev_start_dt
    while curr < prev_end_dt:
        prev_daily_revenue[curr.strftime("%Y-%m-%d")] = 0.0
        curr += timedelta(days=1)
        
    for row in prev_daily_raw:
        prev_daily_revenue[str(row.date)] = float(row.revenue or 0)
"""

if target_daily in content:
    content = content.replace(target_daily, replacement_daily)
if target_prev_daily in content:
    content = content.replace(target_prev_daily, replacement_prev_daily)

with open("backend/app/api/v1/analytics.py", "w") as f:
    f.write(content)

print("Analytics dates fixed!")
