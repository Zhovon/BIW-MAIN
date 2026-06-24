with open("backend/app/api/v1/analytics.py", "r") as f:
    content = f.read()

# Add BranchTarget to import
if "BranchTarget" not in content:
    content = content.replace(
        "from app.models.clinic import Sale, SaleEmployee, Service, Customer, Employee, Branch",
        "from app.models.clinic import Sale, SaleEmployee, Service, Customer, Employee, Branch, BranchTarget"
    )

target_injection = """    # 5. Target Run-Rate
    month_str = f"{end_dt.year}-{end_dt.month:02d}"
    target_q = db.query(BranchTarget).filter(BranchTarget.month == month_str)
    if branch_id and branch_id != "all":
        target_q = target_q.filter(BranchTarget.branch_id == branch_id)
    
    targets = target_q.all()
    target_amount = sum(float(t.target_amount) for t in targets)
    target_run_rate = (total_revenue / target_amount * 100) if target_amount > 0 else 0

    snapshot = {"""

if "    snapshot = {" in content and "target_amount =" not in content:
    content = content.replace("    snapshot = {", target_injection)

# Return dictionary update
return_injection = """        "target_amount": target_amount,
        "target_run_rate": target_run_rate,
        "snapshot": snapshot,"""

if '"snapshot": snapshot,' in content and '"target_run_rate"' not in content:
    content = content.replace('        "snapshot": snapshot,', return_injection)

with open("backend/app/api/v1/analytics.py", "w") as f:
    f.write(content)

print("Analytics target patched!")
