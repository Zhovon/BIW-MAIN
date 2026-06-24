import re

with open("frontend/src/app/dashboard/manager/page.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "CrmPortal" not in content:
    content = content.replace('import React, { useState, useEffect, useRef } from "react";', 
                              'import React, { useState, useEffect, useRef } from "react";\nimport { CrmPortal } from "@/components/crm-portal";')

# 2. Remove customer states
content = re.sub(r'const \[customers, setCustomers\] = useState<CustomerResult\[\]>\(\[\]\);\n\s*', '', content)
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
crm_start = content.find('{activeTab === "crm" && (')
# In manager/page.tsx, the next tab after crm might be 'settings' or something else.
# Let's find the next {activeTab === 
next_tab_start = content.find('{activeTab ===', crm_start + 10)

if crm_start != -1 and next_tab_start != -1:
    before = content[:crm_start]
    after = content[next_tab_start:]
    replacement = '        {activeTab === "crm" && (\n          <CrmPortal services={services} />\n        )}\n\n        '
    content = before + replacement + after
elif crm_start != -1: # if it's the last tab
    before = content[:crm_start]
    # find the end of the section
    end_main = content.rfind('</main>')
    if end_main != -1:
        after = content[end_main:]
        replacement = '        {activeTab === "crm" && (\n          <CrmPortal services={services} />\n        )}\n      '
        content = before + replacement + after

with open("frontend/src/app/dashboard/manager/page.tsx", "w") as f:
    f.write(content)

print("Modified manager/page.tsx successfully!")
