with open("frontend/src/app/dashboard/owner/page.tsx", "r") as f:
    content = f.read()

# Find where the old CRM portal starts
crm_start = content.find('{activeTab === "crm" && (')

# Find the end of the <main> block
main_end = content.rfind('</main>')

if crm_start != -1 and main_end != -1:
    before = content[:crm_start]
    after = content[main_end:]
    
    # We want to close the <section> that contains all the tabs, then close <main>
    # The structure is:
    # <main>
    #   <section>
    #     {activeTab === "audit" && (...)}
    #     {activeTab === "crm" && (<CrmPortal />)}
    #   </section>
    # </main>
    
    replacement = '        {activeTab === "crm" && (\n          <CrmPortal services={services} />\n        )}\n      </section>\n    '
    content = before + replacement + after

with open("frontend/src/app/dashboard/owner/page.tsx", "w") as f:
    f.write(content)

print("Fixed owner/page.tsx CRM block!")
