import os

files = [
    "frontend/src/app/dashboard/manager/page.tsx",
    "frontend/src/app/dashboard/owner/page.tsx",
    "frontend/src/app/dashboard/employee/page.tsx",
    "frontend/src/components/crm-portal.tsx",
    "frontend/src/components/risk-coded-dashboard.tsx"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    # Text colors
    content = content.replace('color: "#fff"', 'color: "var(--text)"')
    content = content.replace("color: '#fff'", "color: 'var(--text)'")
    content = content.replace('rgba(244,248,255,0.38)', 'var(--muted-light)')
    content = content.replace('rgba(255,255,255,0.3)', 'var(--muted-light)')
    
    # Backgrounds and borders (light theme uses black alphas)
    content = content.replace('rgba(255, 255, 255, 0.01)', 'rgba(0, 0, 0, 0.01)')
    content = content.replace('rgba(255, 255, 255, 0.02)', 'rgba(0, 0, 0, 0.02)')
    content = content.replace('rgba(255, 255, 255, 0.03)', 'rgba(0, 0, 0, 0.03)')
    content = content.replace('rgba(255,255,255,0.03)', 'rgba(0, 0, 0, 0.03)')
    content = content.replace('rgba(255,255,255,0.04)', 'rgba(0, 0, 0, 0.04)')
    
    # Check if there are other #ffffff or similar
    content = content.replace('color: "#ffffff"', 'color: "var(--text)"')

    with open(filepath, "w") as f:
        f.write(content)

print("Colors fixed for light theme!")
