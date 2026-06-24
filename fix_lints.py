import re

# 1. Fix owner/page.tsx
with open("frontend/src/app/dashboard/owner/page.tsx", "r") as f:
    content = f.read()

# Check if CrmPortal is actually used
if "<CrmPortal" not in content:
    # My previous script failed to insert <CrmPortal services={services} /> properly!
    # Let's find activeTab === "crm" and replace the block
    start_idx = content.find('{activeTab === "crm" && (')
    if start_idx != -1:
        # find the end of the crm block... it ends right before {activeTab === "staff"
        end_idx = content.find('{activeTab === "staff" && (')
        if end_idx != -1:
            content = content[:start_idx] + '        {activeTab === "crm" && (\n          <CrmPortal services={services} />\n        )}\n\n        ' + content[end_idx:]

content = re.sub(r'import\s+\{.*Customer.*\}\s+from\s+"@/types";\n?', 'import { Customer } from "@/types";\n', content)
content = re.sub(r'type\s+Customer\s+=\s+\{.*?\}\n\n', '', content, flags=re.DOTALL) # remove inline Customer type if exists
content = re.sub(r'interface\s+Customer\s+\{.*?\n\}\n', '', content, flags=re.DOTALL) 

with open("frontend/src/app/dashboard/owner/page.tsx", "w") as f:
    f.write(content)


# 2. Fix manager/page.tsx
with open("frontend/src/app/dashboard/manager/page.tsx", "r") as f:
    content = f.read()

if 'import { CrmPortal }' not in content:
    content = content.replace('import React', 'import { CrmPortal } from "@/components/crm-portal";\nimport React')

# Remove all the unused CRM states explicitly
content = re.sub(r'const\s+\[customers,\s*setCustomers\]\s*=\s*useState<.*?>\(\[\]\);\n', '', content)
content = re.sub(r'const\s+\[selectedCrmCustomer,\s*setSelectedCrmCustomer\].*?\n', '', content)
content = re.sub(r'const\s+\[crmSearchQuery,\s*setCrmSearchQuery\].*?\n', '', content)
content = re.sub(r'const\s+\[showCrmAddForm,\s*setShowCrmAddForm\].*?\n', '', content)
content = re.sub(r'const\s+\[newCrmName,\s*setNewCrmName\].*?\n', '', content)
content = re.sub(r'const\s+\[newCrmPhone,\s*setNewCrmPhone\].*?\n', '', content)
content = re.sub(r'const\s+\[newCrmEmail,\s*setNewCrmEmail\].*?\n', '', content)
content = re.sub(r'const\s+\[newCrmNotes,\s*setNewCrmNotes\].*?\n', '', content)
content = re.sub(r'const\s+\[crmCustCreating,\s*setCrmCustCreating\].*?\n', '', content)

# Remove unused review states
content = re.sub(r'const\s+\[revRating,\s*setRevRating\].*?\n', '', content)
content = re.sub(r'const\s+\[revSubmitting,\s*setRevSubmitting\].*?\n', '', content)
content = re.sub(r'const\s+\[revError,\s*setRevError\].*?\n', '', content)
content = re.sub(r'const\s+\[revSuccess,\s*setRevSuccess\].*?\n', '', content)

# Remove unused handleLogReview
content = re.sub(r'const\s+handleLogReview\s*=\s*async.*?\};', '', content, flags=re.DOTALL)

# Remove customersData from fetch
content = re.sub(r'const\s+customersData\s*=\s*await\s+customersRes\.json\(\);\n', '', content)

with open("frontend/src/app/dashboard/manager/page.tsx", "w") as f:
    f.write(content)

# 3. Fix crm-portal.tsx err
with open("frontend/src/components/crm-portal.tsx", "r") as f:
    content = f.read()
content = content.replace('catch (err) {', 'catch {')
with open("frontend/src/components/crm-portal.tsx", "w") as f:
    f.write(content)

# 4. Fix toast.tsx ToastProps
with open("frontend/src/components/ui/toast.tsx", "r") as f:
    content = f.read()
content = content.replace('type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;\n', '')
with open("frontend/src/components/ui/toast.tsx", "w") as f:
    f.write(content)

print("Fixed lint errors!")
