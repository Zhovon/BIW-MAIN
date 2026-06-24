import re

def clean_file(filepath, is_owner):
    with open(filepath, "r") as f:
        lines = f.readlines()
        
    new_lines = []
    skip = False
    
    # Flags for CRM JSX block
    in_crm_jsx = False
    
    # Flags for CRM logic block
    in_handle_create = False
    
    # Flags for unused variables
    crm_states_deleted = False

    for i, line in enumerate(lines):
        # Insert imports
        if "import " in line and "react" in line.lower() and not "CrmPortal" in "".join(lines):
            new_lines.append(line)
            new_lines.append('import { CrmPortal } from "@/components/crm-portal";\n')
            continue

        # Skip CRM states specifically
        if "const [crmSearchQuery" in line or "const [showCrmAddForm" in line or "const [newCrmName" in line or "const [newCrmPhone" in line or "const [newCrmEmail" in line or "const [newCrmNotes" in line or "const [crmCustCreating" in line or "const [selectedCrmCustomer" in line or "const [customers, setCustomers]" in line:
            continue

        # Skip the customer fetch block explicitly (it's inside Promise.all)
        if "authFetch(`${base}/api/v1/customers`)" in line:
            continue
        if "customersRes," in line and "authFetch" not in line:
            continue
        if "!customersRes.ok ||" in line:
            continue
        if "const customersData =" in line and "customersRes.json()" in line:
            continue
        if "setCustomers(customersData);" in line:
            continue

        # Skip the handleCreateCrmCustomer function
        if "const handleCreateCrmCustomer = async () => {" in line:
            in_handle_create = True
            continue
            
        if in_handle_create:
            if "};" in line and lines[i-1].strip() == "}":
                in_handle_create = False
            continue

        # Skip CRM JSX Block
        if '{activeTab === "crm" && (' in line:
            in_crm_jsx = True
            new_lines.append(line)
            new_lines.append('          <CrmPortal services={services} />\n')
            new_lines.append('        )}\n')
            continue
            
        if in_crm_jsx:
            if '{activeTab === ' in line or '</section>' in line:
                in_crm_jsx = False
                new_lines.append(line)
            continue
            
        new_lines.append(line)
        
    with open(filepath, "w") as f:
        f.writelines(new_lines)

clean_file("frontend/src/app/dashboard/owner/page.tsx", True)
clean_file("frontend/src/app/dashboard/manager/page.tsx", False)

print("Cleaned properly!")
