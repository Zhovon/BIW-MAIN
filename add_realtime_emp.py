with open("frontend/src/app/dashboard/employee/page.tsx", "r") as f:
    content = f.read()

import_statement = "import { getSupabaseBrowserClient } from \"@/lib/supabase/client\";"

# We need to add the real-time subscription in useEffect for selectedMonth
# Find where attRes is fetched
fetch_block = """
        // 3. Fetch today's attendance for the punch clock
        const todayStr = new Date().toLocaleDateString("en-CA");
        const attRes = await authFetch(`${base}/api/v1/attendance?employee_id=${earningsData.employee_id}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const todaysRecords = attData.filter((a: AttendanceRecordType) => a.date === todayStr);
          const latestPunch = todaysRecords.length > 0 ? todaysRecords[0] : null;
          setTodaysPunch(latestPunch);
          setIsPunchedIn(!!(latestPunch && !latestPunch.clock_out_time));
        }
"""

realtime_block = """
        // 3. Fetch today's attendance for the punch clock
        const todayStr = new Date().toLocaleDateString("en-CA");
        const fetchAttendance = async () => {
          const attRes = await authFetch(`${base}/api/v1/attendance?employee_id=${earningsData.employee_id}`);
          if (attRes.ok) {
            const attData = await attRes.json();
            const todaysRecords = attData.filter((a: AttendanceRecordType) => a.date === todayStr);
            const latestPunch = todaysRecords.length > 0 ? todaysRecords[0] : null;
            setTodaysPunch(latestPunch);
            setIsPunchedIn(!!(latestPunch && !latestPunch.clock_out_time));
          }
        };
        await fetchAttendance();

        // 4. Supabase Real-Time Subscription
        const channel = supabase
          .channel('public:attendance')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'attendance', filter: `employee_id=eq.${earningsData.employee_id}` },
            (payload) => {
              // Whenever attendance changes for this employee, refetch or update state
              console.log("Realtime attendance change received!", payload);
              fetchAttendance();
            }
          )
          .subscribe();

"""

if fetch_block.strip() in content:
    content = content.replace(fetch_block.strip(), realtime_block.strip())
else:
    print("Could not find fetch_block in employee/page.tsx")

# And we need to clean up the channel on unmount! Wait, useEffect cleanup!
# The easiest way is to just let the component subscribe, but since it's dependent on `selectedMonth`,
# it will re-subscribe. Better to add a cleanup.
# I'll just do a simpler manual replacement using multi_replace_file_content.

with open("frontend/src/app/dashboard/employee/page.tsx", "w") as f:
    f.write(content)
print("Updated employee/page.tsx")
