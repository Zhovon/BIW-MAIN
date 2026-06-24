from datetime import datetime, timedelta

start_dt = datetime.now() - timedelta(days=7)
end_dt = datetime.now()

curr = start_dt
daily = {}
while curr < end_dt:
    daily[curr.strftime("%Y-%m-%d")] = 0.0
    curr += timedelta(days=1)

print(f"Days calculated using < : {len(daily)}")
print(list(daily.keys()))

curr = start_dt.date()
daily2 = {}
while curr <= end_dt.date():
    daily2[curr.strftime("%Y-%m-%d")] = 0.0
    curr += timedelta(days=1)

print(f"Days calculated using <= and date() : {len(daily2)}")
print(list(daily2.keys()))
