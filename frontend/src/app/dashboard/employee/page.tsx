"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type TreatmentDetail = {
  id: string;
  service_name: string;
  sale_amount: number;
  discount_amount: number;
  earned_amount: number;
  earning_type: "bonus" | "commission";
  created_at: string | null;
};

type EarningsProfile = {
  employee_id: string;
  full_name: string;
  role: string;
  month: string;
  base_salary: number;
  bonus_earned: number;
  commission_earned: number;
  late_deduction: number;
  leave_deduction: number;
  total_deductions: number;
  total_earned: number;
  treatment_count: number;
  treatments: TreatmentDetail[];
};

type ServiceAssignment = {
  id: string;
  service_id: string;
  employee_id: string;
  bonus_amount: number;
};

type Service = {
  id: string;
  name: string;
  price: number;
};

type AttendanceRecordType = {
  employee_id: string;
  date: string;
  status: string;
  deduction_amount: number;
  clock_in_time: string | null;
  clock_out_time: string | null;
  overtime_minutes: number;
};

export default function EmployeeDashboardPage() {
  const [earnings, setEarnings] = useState<EarningsProfile | null>(null);
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time Punch State
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchSubmitting, setPunchSubmitting] = useState(false);
  const [todaysPunch, setTodaysPunch] = useState<AttendanceRecordType | null>(null);

  // Load current month by default
  useEffect(() => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;

    const loadEmployeeEarnings = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("No active session found. Please log in.");
        }

        const base = getApiBaseUrl();

        // 1. Fetch personal earnings profile by Supabase user.id
        const earningsRes = await authFetch(`${base}/api/v1/payroll/employee/user/${user.id}?month=${selectedMonth}`);
        if (!earningsRes.ok) {
          throw new Error("Could not load earnings profile. Ensure your account is linked to an active employee record.");
        }
        const earningsData: EarningsProfile = await earningsRes.json();
        setEarnings(earningsData);

        // 2. Fetch service assignments and services to show their linked bonuses
        const [assignmentsRes, servicesRes] = await Promise.all([
          authFetch(`${base}/api/v1/service-assignments`),
          authFetch(`${base}/api/v1/services`)
        ]);

        if (assignmentsRes.ok && servicesRes.ok) {
          const allAssignments: ServiceAssignment[] = await assignmentsRes.json();
          const allServices: Service[] = await servicesRes.json();
          
          // Filter assignments specific to this therapist
          const therapistAssignments = allAssignments.filter(a => a.employee_id === earningsData.employee_id);
          setAssignments(therapistAssignments);
          setServices(allServices);
        }

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
        supabase
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

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeEarnings();
  }, [selectedMonth]);

  const handleMonthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  const getServiceName = (serviceId: string) => {
    const s = services.find(item => item.id === serviceId);
    return s ? s.name : "Treatment Service";
  };

  const getServicePrice = (serviceId: string) => {
    const s = services.find(item => item.id === serviceId);
    return s ? s.price : 0;
  };

  const handlePunch = async () => {
    if (!earnings) return;
    setPunchSubmitting(true);
    try {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/attendance/punch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: earnings.employee_id, date: todayStr })
      });
      if (!res.ok) throw new Error("Failed to punch time");
      const data = await res.json();
      setTodaysPunch(data);
      setIsPunchedIn(!data.clock_out_time);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setPunchSubmitting(false);
    }
  };

  if (loading && !earnings) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <div>
            <p className="section-label">Therapist Portal</p>
            <h1>Loading performance dashboard...</h1>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <div className="border-2 border-black bg-white" style={{ border: "2px solid #000" }}>
            <p className="section-label" style={{ color: "#000" }}>Access Error</p>
            <h1>Portal Unavailable</h1>
            <p className="dashboard-lead">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="content-grid">
        
        {/* Top bar with Month Selector */}
        <div  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "28px" }}>
          <div>
            <p className="section-label">Therapist Performance Workspace</p>
            <h1 style={{ fontFamily: "Times New Roman, serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
              {earnings?.full_name}
            </h1>
            <p style={{ color: "#000", fontWeight: "bold", margin: "4px 0 0", fontWeight: "600", fontSize: "1.05rem" }}>
              {earnings?.role}
            </p>
          </div>

          <div>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: "#555" }}>Select Operations Month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                style={{ borderRadius: "0", border: "1px solid #000", background: "#fff", padding: "0.65rem 1rem", color: "#000", outline: "none", font: "inherit" }}
              />
            </label>
          </div>
        </div>

        {/* Time Punch Card */}
        <article className=" mobile-stack border border-black bg-white" style={{ padding: "24px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", border: isPunchedIn ? "1px solid rgba(142, 240, 178, 0.4)" : "1px solid var(--line)", gap: "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: "0 0 4px", color: isPunchedIn ? "#92fb9c" : "var(--muted)" }}>
              {isPunchedIn ? "🟢 You are Clocked In" : "⚪ You are Clocked Out"}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#555", margin: 0 }}>
              {todaysPunch?.clock_in_time ? `Clocked in at ${new Date(todaysPunch.clock_in_time).toLocaleTimeString()}` : "Record your attendance for today."}
              {todaysPunch?.clock_out_time && ` • Clocked out at ${new Date(todaysPunch.clock_out_time).toLocaleTimeString()}`}
            </p>
          </div>
          <button
            onClick={handlePunch}
            disabled={punchSubmitting}
            className={isPunchedIn ? "button button--secondary" : "button button--primary"}
            style={{ padding: "0.8rem 2rem", fontSize: "1.05rem", minWidth: "160px" }}
          >
            {punchSubmitting ? "Wait..." : isPunchedIn ? "Clock Out" : "Clock In"}
          </button>
        </article>

        {/* Live Monthly Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-black" style={{ margin: "0 0 32px" }}>
          <article className="p-4 border-b md:border-b-0 md:border-r border-black last:border-r-0 bg-white" style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000", marginBottom: "6px" }}>Guaranteed Base Salary</span>
            <strong style={{ fontSize: "26px", fontWeight: "bold", color: "#000", lineHeight: 1 }}>৳{earnings?.base_salary.toLocaleString()}</strong>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#555", marginTop: "8px" }}>Paid monthly regardless of service sales.</p>
          </article>

          <article className="p-4 border-b md:border-b-0 md:border-r border-black last:border-r-0 bg-white" style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000", marginBottom: "6px" }}>Accumulated Treatment Bonuses</span>
            <strong style={{ fontSize: "26px", fontWeight: "bold", color: "#000", lineHeight: 1 }}>৳{earnings?.bonus_earned.toLocaleString()}</strong>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#555", marginTop: "8px" }}>From {earnings?.treatments.filter(t => t.earning_type === "bonus").length} customized therapist bonuses.</p>
          </article>

          <article className="p-4 border-b md:border-b-0 md:border-r border-black last:border-r-0 bg-white" style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000", marginBottom: "6px" }}>Accumulated Sales Commissions</span>
            <strong style={{ fontSize: "26px", fontWeight: "bold", color: "#000", lineHeight: 1 }}>৳{earnings?.commission_earned.toLocaleString()}</strong>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#555", marginTop: "8px" }}>From {earnings?.treatments.filter(t => t.earning_type === "commission").length} standard revenue shares.</p>
          </article>

          <article className="p-4 border-b md:border-b-0 md:border-r border-black last:border-r-0 bg-white" style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000", marginBottom: "6px" }}>Total Estimated Monthly Payroll</span>
            <strong style={{ fontSize: "26px", fontWeight: "bold", color: "#000", lineHeight: 1 }} style={{ color: "#000" }}>
              ৳{earnings?.total_earned.toLocaleString()}
            </strong>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#555", marginTop: "8px" }}>Subject to owner verification run.</p>
          </article>

          {earnings && earnings.total_deductions > 0 && (
            <article className="p-4 border-b md:border-b-0 md:border-r border-black last:border-r-0 bg-white" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000", marginBottom: "6px" }} style={{ color: "#000" }}>Total Deductions Applied</span>
              <strong style={{ fontSize: "26px", fontWeight: "bold", color: "#000", lineHeight: 1 }} style={{ color: "#000" }}>
                -৳{earnings.total_deductions.toLocaleString()}
              </strong>
              <p style={{ fontSize: "12px", fontStyle: "italic", color: "#555", marginTop: "8px" }} style={{ color: "#555" }}>
                From late penalties or leaves.
              </p>
            </article>
          )}
        </div>

        {/* Main Content split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          
          {/* Left Panel: Completed Treatments Log */}
          <article className=" border border-black bg-white" style={{ padding: "28px" }}>
            <h2 style={{ fontFamily: "Times New Roman, serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", fontSize: "16px", margin: "0 0 16px", borderBottom: "2px solid #000", paddingBottom: "8px" }}>Completed Treatments Log</h2>

            {earnings?.treatments.length === 0 ? (
              <p style={{ color: "#555", textAlign: "center", padding: "40px 0" }}>
                No services or treatments logged for this month.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {earnings?.treatments.map((t) => {
                  const dateStr = t.created_at 
                    ? new Date(t.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) 
                    : "";

                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: "16px",
                        borderRadius: "0", background: "#fff",
                        border: "1px solid #000",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px"
                      }}
                      
                    >
                      <div>
                        <strong style={{ fontSize: "1.05rem", color: "#000" }}>{t.service_name}</strong>
                        <div style={{ fontSize: "0.82rem", color: "#555", marginTop: "4px" }}>
                          Treatment Price: ৳{t.sale_amount.toLocaleString()} 
                          {t.discount_amount > 0 && ` (৳${t.discount_amount.toLocaleString()} discount applied)`}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#777" }}>{dateStr}</span>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          padding: "2px 8px",
                          borderRadius: "0", background: t.earning_type === "bonus" ? "#000" : "#eee",
                          color: t.earning_type === "bonus" ? "#fff" : "#000",
                          border: "1px solid #000",
                          display: "inline-block",
                          marginBottom: "4px"
                        }}>
                          {t.earning_type === "bonus" ? "Flat Bonus" : "Commission"}
                        </span>
                        <strong style={{ display: "block", fontSize: "1.15rem", color: "#000", fontWeight: "bold" }}>
                          +৳{t.earned_amount.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          {/* Right Panel: Configured Bonus Linkages */}
          <article className=" border border-black bg-white" style={{ padding: "28px", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontFamily: "Times New Roman, serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", fontSize: "16px", margin: "0 0 12px", borderBottom: "2px solid #000", paddingBottom: "8px", color: "#000", fontWeight: "bold" }}>My Bonus Linkages</h2>
            <p style={{ color: "#555", fontSize: "0.88rem", margin: "0 0 20px" }}>
              Treatments matching these assignments pay a flat bonus instead of standard commissions.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
              {assignments.length === 0 ? (
                <p style={{ color: "#555", fontSize: "0.9rem", textAlign: "center", padding: "30px 0" }}>
                  No customized service bonuses linked to your profile. All treatments pay standard commission rate.
                </p>
              ) : (
                assignments.map((asg) => (
                  <div
                    key={asg.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "0", background: "#fff",
                      border: "1px solid #000",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", fontSize: "0.95rem", color: "#000" }}>
                        {getServiceName(asg.service_id)}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "#555" }}>
                        Standard price: ৳{getServicePrice(asg.service_id).toLocaleString()}
                      </span>
                    </div>

                    <strong style={{ fontSize: "1.1rem", color: "#000", fontWeight: "bold" }}>
                      ৳{asg.bonus_amount.toLocaleString()} bonus
                    </strong>
                  </div>
                ))
              )}
            </div>
          </article>

        </div>

      </section>
    </main>
  );
}