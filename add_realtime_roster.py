import os

files = [
    "frontend/src/app/dashboard/manager/page.tsx",
    "frontend/src/app/dashboard/owner/page.tsx"
]

import_stmt = 'import { getSupabaseBrowserClient } from "@/lib/supabase/client";\n'

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    if "getSupabaseBrowserClient" not in content:
        content = content.replace('"use client";\n', '"use client";\n' + import_stmt)

    target = "    fetchRoster();\n  }, ["
    replacement = """    fetchRoster();

    const channel = getSupabaseBrowserClient()
      .channel('public:attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log("Realtime roster update!", payload);
          fetchRoster(false);
        }
      )
      .subscribe();

    return () => {
      getSupabaseBrowserClient().removeChannel(channel);
    };
  }, ["""

    if target in content and "public:attendance" not in content:
        content = content.replace(target, replacement)
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Could not find target or already updated in {filepath}")

