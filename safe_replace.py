import re

def process_file(filepath):
    with open(filepath, "r") as f:
        lines = f.readlines()
    
    new_lines = []
    in_crm_block = False
    in_crm_states = False
    crm_added = False
    has_imported = False

    for i, line in enumerate(lines):
        # 1. Add Import
        if "import " in line and not has_imported:
            new_lines.append('import { CrmPortal } from "@/components/crm-portal";\n')
            has_imported = True
            
        # 2. Skip unused variables explicitly by substring
        skip = False
        for unused in [
            "const [customers, setCustomers]",
            "const [crmSearchQuery, setCrmSearchQuery]",
            "const [showCrmAddForm, setShowCrmAddForm]",
            "const [newCrmName, setNewCrmName]",
            "const [newCrmPhone, setNewCrmPhone]",
            "const [newCrmEmail, setNewCrmEmail]",
            "const [newCrmNotes, setNewCrmNotes]",
            "const [crmCustCreating, setCrmCustCreating]",
            "const [selectedCrmCustomer, setSelectedCrmCustomer]",
            "const handleCreateCrmCustomer =",
            "if (!newCrmName || !newCrmPhone)",
            "setCrmCustCreating(true);",
            "const res = await authFetch(",
            "method: \"POST\"",
            "body: JSON.stringify({",
            "full_name: newCrmName,",
            "phone: newCrmPhone,",
            "email: newCrmEmail,",
            "notes: newCrmNotes",
            "const newCust = await res.json();",
            "setCustomers(prev => [newCust, ...prev]);",
            "setShowCrmAddForm(false);",
            "setNewCrmName(\"\");",
            "setNewCrmPhone(\"\");",
            "setNewCrmEmail(\"\");",
            "setNewCrmNotes(\"\");",
            "setSelectedCrmCustomer(newCust);",
            "alert(\"Error creating customer.\");",
            "setCrmCustCreating(false);"
        ]:
            if unused in line and not "import" in line:
                # We skip these specific lines
                skip = True
                break
                
        # 3. Replace the JSX CRM Tab block safely
        if '{activeTab === "crm" && (' in line:
            in_crm_block = True
            new_lines.append(line)
            new_lines.append('          <CrmPortal services={services} />\n')
            new_lines.append('        )}\n')
            continue
            
        if in_crm_block:
            # We are skipping the old CRM block until we see the start of the next tab or </section>
            if '{activeTab ===' in line or '</section>' in line:
                in_crm_block = False
                new_lines.append(line)
            continue
            
        if not skip:
            new_lines.append(line)
            
    # Write back
    with open(filepath, "w") as f:
        f.writelines(new_lines)

process_file("frontend/src/app/dashboard/owner/page.tsx")
process_file("frontend/src/app/dashboard/manager/page.tsx")
print("Processed both files safely.")
