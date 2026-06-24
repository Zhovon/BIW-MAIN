with open("frontend/src/app/dashboard/manager/page.tsx", "r") as f:
    content = f.read()

content = content.replace("const customersData: Customer[] = await customersRes.json();\n", "")

with open("frontend/src/app/dashboard/manager/page.tsx", "w") as f:
    f.write(content)

print("Fixed manager/page.tsx")
