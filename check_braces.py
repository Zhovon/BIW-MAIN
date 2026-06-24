with open("frontend/src/app/dashboard/owner/page.tsx", "r") as f:
    text = f.read()

def find_imbalance(text):
    count = 0
    lines = text.split('\n')
    for i, line in enumerate(lines):
        for char in line:
            if char == '{':
                count += 1
            elif char == '}':
                count -= 1
        if count < 0:
            return f"Negative at line {i+1}: {line}"
    return count

print("Balance:", find_imbalance(text))
