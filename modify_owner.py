import re

with open("frontend/src/app/dashboard/owner/page.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "CrmPortal" not in content:
    content = content.replace('import { RiskCodedDashboard } from "@/components/risk-coded-dashboard";', 
                              'import { RiskCodedDashboard } from "@/components/risk-coded-dashboard";\nimport { CrmPortal } from "@/components/crm-portal";')

# 2. Remove customer states
content = re.sub(r'const \[customers, setCustomers\] = useState<Customer\[\]>\(\[\]\);\n\s*', '', content)
content = re.sub(r'// CRM Portal States.*?const \[crmCustCreating, setCrmCustCreating\] = useState\(false\);\n', '', content, flags=re.DOTALL)

# 3. Remove customer fetch logic
content = content.replace(', customersRes', '')
content = content.replace('authFetch(`${base}/api/v1/customers`),', '')
content = content.replace('!customersRes.ok ||', '')
content = content.replace('const customersData = await customersRes.json();', '')
content = content.replace('setCustomers(customersData);', '')

# 4. Remove handleCreateCrmCustomer function
content = re.sub(r'const handleCreateCrmCustomer = async \(\) => \{.*?finally \{\s*setCrmCustCreating\(false\);\s*\}\s*\};\n', '', content, flags=re.DOTALL)

# 5. Replace the CRM Portal JSX
# The block starts at {activeTab === "crm" && ( and ends exactly before {activeTab === "staff" && (
crm_start = content.find('{activeTab === "crm" && (')
staff_start = content.find('{activeTab === "staff" && (')

if crm_start != -1 and staff_start != -1:
    before = content[:crm_start]
    after = content[staff_start:]
    replacement = '        {activeTab === "crm" && (\n          <CrmPortal services={services} />\n        )}\n\n        '
    content = before + replacement + after

with open("frontend/src/app/dashboard/owner/page.tsx", "w") as f:
    f.write(content)

print("Modified owner/page.tsx successfully!")
