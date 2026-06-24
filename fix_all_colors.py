import os
import re

def process_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    original_content = content

    # Replace hardcoded white text
    content = re.sub(r'color:\s*["\']#fff["\']', 'color: "var(--text)"', content)
    content = re.sub(r'color:\s*["\']#ffffff["\']', 'color: "var(--text)"', content, flags=re.IGNORECASE)

    # Replace specific rgba(255, 255, 255, X) with rgba(0, 0, 0, X)
    # This regex looks for rgba(255,255,255,X) with optional spaces
    content = re.sub(r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,', 'rgba(0, 0, 0,', content)

    # Error borders/backgrounds: change them from red+white blends to a better contrast
    # e.g., rgba(255, 100, 100, 0.1) is probably fine as a red tint, but text #ff8282 on white is hard to read.
    # We will change light red text to a deeper red.
    content = re.sub(r'color:\s*["\']#ff7373["\']', 'color: "#cc0000"', content, flags=re.IGNORECASE)
    content = re.sub(r'color:\s*["\']#ff8282["\']', 'color: "#cc0000"', content, flags=re.IGNORECASE)
    content = re.sub(r'color:\s*["\']#ff6c6c["\']', 'color: "#cc0000"', content, flags=re.IGNORECASE)

    if content != original_content:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Updated {filepath}")

# Walk through frontend/src
for root, dirs, files in os.walk("frontend/src"):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts") or file.endswith(".css"):
            process_file(os.path.join(root, file))

print("Color overhaul complete!")
