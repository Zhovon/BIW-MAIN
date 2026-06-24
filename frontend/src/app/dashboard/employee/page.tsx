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
          <div className="glass-card auth-card" style={{ border: "1px solid rgba(255, 100, 100, 0.2)" }}>
            <p className="section-label" style={{ color: "#ff6464" }}>Access Error</p>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "28px" }}>
          <div>
            <p className="section-label">Therapist Performance Workspace</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
              {earnings?.full_name}
            </h1>
            <p style={{ color: "var(--accent)", margin: "4px 0 0", fontWeight: "600", fontSize: "1.05rem" }}>
              {earnings?.role}
            </p>
          </div>

          <div>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Select Operations Month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                style={{ borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.65rem 1rem", color: "var(--text)", outline: "none", font: "inherit" }}
              />
            </label>
          </div>
        </div>

        {/* Time Punch Card */}
        <article className="glass-card" style={{ padding: "24px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", border: isPunchedIn ? "1px solid rgba(142, 240, 178, 0.4)" : "1px solid var(--line)" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: "0 0 4px", color: isPunchedIn ? "#92fb9c" : "var(--muted)" }}>
              {isPunchedIn ? "🟢 You are Clocked In" : "⚪ You are Clocked Out"}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
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
        <div className="stat-grid" style={{ margin: "0 0 32px" }}>
          <article className="stat-card" style={{ "--accent": "#C9A84C" } as React.CSSProperties}>
            <span className="stat-card__label">Guaranteed Base Salary</span>
            <strong className="stat-card__value">৳{earnings?.base_salary.toLocaleString()}</strong>
            <p className="stat-card__detail">Paid monthly regardless of service sales.</p>
          </article>

          <article className="stat-card" style={{ "--accent": "#E8C96A" } as React.CSSProperties}>
            <span className="stat-card__label">Accumulated Treatment Bonuses</span>
            <strong className="stat-card__value">৳{earnings?.bonus_earned.toLocaleString()}</strong>
            <p className="stat-card__detail">From {earnings?.treatments.filter(t => t.earning_type === "bonus").length} customized therapist bonuses.</p>
          </article>

          <article className="stat-card" style={{ "--accent": "#A07830" } as React.CSSProperties}>
            <span className="stat-card__label">Accumulated Sales Commissions</span>
            <strong className="stat-card__value">৳{earnings?.commission_earned.toLocaleString()}</strong>
            <p className="stat-card__detail">From {earnings?.treatments.filter(t => t.earning_type === "commission").length} standard revenue shares.</p>
          </article>

          <article className="stat-card" style={{ "--accent": "#C9A84C" } as React.CSSProperties}>
            <span className="stat-card__label">Total Estimated Monthly Payroll</span>
            <strong className="stat-card__value" style={{ color: "var(--gold-light)" }}>
              ৳{earnings?.total_earned.toLocaleString()}
            </strong>
            <p className="stat-card__detail">Subject to owner verification run.</p>
          </article>

          {earnings && earnings.total_deductions > 0 && (
            <article className="stat-card" style={{ "--accent": "#ff6b6b" } as React.CSSProperties}>
              <span className="stat-card__label" style={{ color: "#ff6b6b" }}>Total Deductions Applied</span>
              <strong className="stat-card__value" style={{ color: "#ff6b6b" }}>
                -৳{earnings.total_deductions.toLocaleString()}
              </strong>
              <p className="stat-card__detail" style={{ color: "var(--muted)" }}>
                From late penalties or leaves.
              </p>
            </article>
          )}
        </div>

        {/* Main Content split */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
          
          {/* Left Panel: Completed Treatments Log */}
          <article className="glass-card" style={{ padding: "28px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 20px" }}>Completed Treatments Log</h2>

            {earnings?.treatments.length === 0 ? (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>
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
                        borderRadius: "16px",
                        background: "rgba(0, 0, 0, 0.02)",
                        border: "1px solid var(--line)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "1.05rem", color: "var(--text)" }}>{t.service_name}</strong>
                        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "4px" }}>
                          Treatment Price: ৳{t.sale_amount.toLocaleString()} 
                          {t.discount_amount > 0 && ` (৳${t.discount_amount.toLocaleString()} discount applied)`}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted-light)" }}>{dateStr}</span>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: t.earning_type === "bonus" ? "rgba(110,231,255,0.1)" : "rgba(156,123,255,0.1)",
                          color: t.earning_type === "bonus" ? "var(--accent)" : "var(--accent-2)",
                          border: `1px solid ${t.earning_type === "bonus" ? "rgba(110,231,255,0.15)" : "rgba(156,123,255,0.15)"}`,
                          display: "inline-block",
                          marginBottom: "4px"
                        }}>
                          {t.earning_type === "bonus" ? "Flat Bonus" : "Commission"}
                        </span>
                        <strong style={{ display: "block", fontSize: "1.15rem", color: "var(--accent-3)" }}>
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
          <article className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 10px", color: "var(--accent)" }}>My Bonus Linkages</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 20px" }}>
              Treatments matching these assignments pay a flat bonus instead of standard commissions.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
              {assignments.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", padding: "30px 0" }}>
                  No customized service bonuses linked to your profile. All treatments pay standard commission rate.
                </p>
              ) : (
                assignments.map((asg) => (
                  <div
                    key={asg.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "rgba(0, 0, 0, 0.02)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--text)" }}>
                        {getServiceName(asg.service_id)}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        Standard price: ৳{getServicePrice(asg.service_id).toLocaleString()}
                      </span>
                    </div>

                    <strong style={{ fontSize: "1.1rem", color: "var(--accent)" }}>
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