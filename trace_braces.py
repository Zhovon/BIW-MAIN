with open("frontend/src/app/dashboard/owner/page.tsx", "r") as f:
    text = f.read()

count = 0
lines = text.split('\n')
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            count += 1
        elif char == '}':
            count -= 1
    # Check if we hit 0 prematurely
    if count == 0 and i > 10 and i < len(lines) - 5:
        print(f"Hit 0 at line {i+1}: {line}")
