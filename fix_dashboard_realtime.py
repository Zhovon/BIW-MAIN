with open("frontend/src/components/risk-coded-dashboard.tsx", "r") as f:
    content = f.read()

import_stmt = 'import { getSupabaseBrowserClient } from "@/lib/supabase/client";\n'

if "getSupabaseBrowserClient" not in content:
    # Insert it after import { getApiBaseUrl...
    content = content.replace(
        'import { getApiBaseUrl, authFetch } from "@/lib/api";',
        'import { getApiBaseUrl, authFetch } from "@/lib/api";\n' + import_stmt
    )

target = """    fetchData();
  }, [period, branchId, customDate, staffName, paymentMethod, ticketBand]);"""

replacement = """    fetchData();

    const channel = getSupabaseBrowserClient()
      .channel('public:sales_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          console.log("Realtime sale update!", payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      getSupabaseBrowserClient().removeChannel(channel);
    };
  }, [period, branchId, customDate, staffName, paymentMethod, ticketBand]);"""

if target in content and "public:sales_dashboard" not in content:
    content = content.replace(target, replacement)
    with open("frontend/src/components/risk-coded-dashboard.tsx", "w") as f:
        f.write(content)
    print("Dashboard Realtime Fix Applied!")
else:
    print("Target not found or already applied!")

