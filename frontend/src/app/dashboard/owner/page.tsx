"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { CalendarPicker } from "@/components/calendar-picker";

type BranchFinancial = {
  branch: string;
  revenue: number;
  cost: number;
  profit: number;
};

type OverviewData = {
  revenue_total: number;
  cost_total: number;
  profit_total: number;
  branches: BranchFinancial[];
};

type Branch = {
  id: string;
  name: string;
  city: string;
};

type PayrollEmployee = {
  employee_id: string;
  full_name: string;
  role: string;
  base_salary: number;
  bonus_earned: number;
  commission_earned: number;
  total_earned: number;
  treatment_count: number;
};

type CalculatedPayroll = {
  branch_id: string;
  branch_name: string;
  month: string;
  salary_total: number;
  bonus_total: number;
  commission_total: number;
  total_payroll: number;
  employees: PayrollEmployee[];
};

type PayrollRunHistory = {
  id: string;
  branch_id: string | null;
  month: string;
  salary_total: number;
  bonus_total: number;
  commission_total: number;
};

type Sale = {
  id: string;
  branch_id: string | null;
  service_id: string | null;
  employee_id: string | null;
  customer_id: string | null;
  employee_ids: string[];
  sale_amount: number;
  discount_amount: number;
  created_at: string;
};

type CostEntry = {
  id: string;
  branch_id: string | null;
  cost_type: string;
  amount: number;
  note: string | null;
  created_at: string;
};

type Service = {
  id: string;
  branch_id: string | null;
  name: string;
  price: number;
  cost: number;
};

type Employee = {
  id: string;
  branch_id: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
};

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export default function OwnerDashboardPage() {
  // Core State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "crm">("dashboard");

  // CRM Portal States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCrmCustomer, setSelectedCrmCustomer] = useState<Customer | null>(null);
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [showCrmAddForm, setShowCrmAddForm] = useState(false);
  const [newCrmName, setNewCrmName] = useState("");
  const [newCrmPhone, setNewCrmPhone] = useState("");
  const [newCrmEmail, setNewCrmEmail] = useState("");
  const [newCrmNotes, setNewCrmNotes] = useState("");
  const [crmCustCreating, setCrmCustCreating] = useState(false);

  // Payroll Calculation Console State
  const [payrollBranchId, setPayrollBranchId] = useState("");
  const [payrollMonth, setPayrollMonth] = useState("");
  const [calculatedPayroll, setCalculatedPayroll] = useState<CalculatedPayroll | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRunHistory[]>([]);
  
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  // Detailed Audit Logs State
  const [sales, setSales] = useState<Sale[]>([]);
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Detailed Audit Logs Filters
  const [auditBranchId, setAuditBranchId] = useState("all");
  const [auditType, setAuditType] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditDate, setAuditDate] = useState<string>(new Date().toLocaleDateString("en-CA"));

  // Owner Analytics Period + Branch Filter State
  const [ownerPeriod, setOwnerPeriod] = useState<"today" | "month" | "custom" | "all">("month");
  const [ownerDate, setOwnerDate] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [ownerMonth, setOwnerMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [ownerBranch, setOwnerBranch] = useState<string>("all");

  useEffect(() => {
    const initOwnerDashboard = async () => {
      try {
        setLoading(true);
        const base = getApiBaseUrl();
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        setPayrollMonth(currentMonth);

        // Fetch Branches, Payroll runs, Sales, Costs, Services, Employees, Customers
        const [
          branchesRes,
          historyRes,
          salesRes,
          costsRes,
          servicesRes,
          employeesRes,
          customersRes
        ] = await Promise.all([
          fetch(`${base}/api/v1/branches`),
          fetch(`${base}/api/v1/payroll`),
          fetch(`${base}/api/v1/sales`),
          fetch(`${base}/api/v1/costs`),
          fetch(`${base}/api/v1/services`),
          fetch(`${base}/api/v1/employees`),
          fetch(`${base}/api/v1/customers`)
        ]);

        if (
          !branchesRes.ok ||
          !historyRes.ok ||
          !salesRes.ok ||
          !costsRes.ok ||
          !servicesRes.ok ||
          !employeesRes.ok ||
          !customersRes.ok
        ) {
          throw new Error("Failed to load operations metrics.");
        }

        const branchesData = await branchesRes.json();
        const historyData = await historyRes.json();
        const salesData = await salesRes.json();
        const costsData = await costsRes.json();
        const servicesData = await servicesRes.json();
        const employeesData = await employeesRes.json();
        const customersData = await customersRes.json();

        setBranches(branchesData);
        setPayrollHistory(historyData);
        setSales(salesData);
        setCosts(costsData);
        setServices(servicesData);
        setEmployees(employeesData);
        setCustomers(customersData);

        if (branchesData.length > 0) {
          setPayrollBranchId(branchesData[0].id);
        }

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    initOwnerDashboard();
  }, []);

  const handleCalculatePayroll = async () => {
    if (!payrollBranchId || !payrollMonth) return;
    setCalcLoading(true);
    setCalcError(null);
    setCalculatedPayroll(null);
    setCommitSuccess(false);

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/v1/payroll/calculate?branch_id=${payrollBranchId}&month=${payrollMonth}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to calculate payroll.");
      }
      const data = await res.json();
      setCalculatedPayroll(data);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setCalcError(errMsg);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleCommitPayroll = async () => {
    if (!calculatedPayroll) return;
    setCommitLoading(true);
    setCommitSuccess(false);

    const payload = {
      branch_id: calculatedPayroll.branch_id,
      month: calculatedPayroll.month,
      salary_total: calculatedPayroll.salary_total,
      bonus_total: calculatedPayroll.bonus_total,
      commission_total: calculatedPayroll.commission_total
    };

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/v1/payroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to post payroll run.");
      }

      const newRun = await res.json();
      setPayrollHistory(prev => [newRun, ...prev]);
      setCommitSuccess(true);
      setCalculatedPayroll(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setCommitLoading(false);
    }
  };

  const handleCreateCrmCustomer = async () => {
    if (!newCrmName || !newCrmPhone) return;
    setCrmCustCreating(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newCrmName,
          phone: newCrmPhone,
          email: newCrmEmail || null,
          notes: newCrmNotes || null
        }),
      });
      if (!res.ok) throw new Error("Failed to create customer.");
      const newCust = await res.json();
      
      setCustomers(prev => [newCust as Customer, ...prev]);
      setSelectedCrmCustomer(newCust as Customer);
      setShowCrmAddForm(false);
      setNewCrmName(""); setNewCrmPhone(""); setNewCrmEmail(""); setNewCrmNotes("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create CRM customer.");
    } finally {
      setCrmCustCreating(false);
    }
  };

  const formatTaka = (amount: number): string => {
    const absVal = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (absVal >= 100000) {
      return `${sign}৳${(absVal / 100000).toFixed(1)}L`;
    }
    if (absVal >= 1000) {
      return `${sign}৳${(absVal / 1000).toFixed(0)}K`;
    }
    return `${sign}৳${absVal}`;
  };

  const getBranchName = (id: string | null) => {
    if (!id) return "General Operations";
    const b = branches.find(item => item.id === id);
    return b ? b.name : id;
  };

  const getTherapistName = (id: string | null) => {
    if (!id) return "Unknown Staff";
    const emp = employees.find(e => e.id === id);
    return emp ? emp.full_name : id;
  };

  const getTherapistNames = (sale: Sale) => {
    const ids = sale.employee_ids && sale.employee_ids.length > 0
      ? sale.employee_ids
      : (sale.employee_id ? [sale.employee_id] : []);
    if (ids.length === 0) return "Unknown Staff";
    return ids.map(id => getTherapistName(id)).join(", ");
  };

  const getServiceName = (id: string | null) => {
    if (!id) return "Treatment";
    const s = services.find(item => item.id === id);
    return s ? s.name : "Treatment";
  };

  // ── Owner Analytics: Period + Branch Filtered Data ──────────────────────────
  const ownerFilteredSales = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA");
    return sales.filter(s => {
      const d = new Date(s.created_at).toLocaleDateString("en-CA");
      if (ownerBranch !== "all" && s.branch_id !== ownerBranch) return false;
      if (ownerPeriod === "today" && d !== today) return false;
      if (ownerPeriod === "month" && d.substring(0, 7) !== ownerMonth) return false;
      if (ownerPeriod === "custom" && d !== ownerDate) return false;
      return true;
    });
  }, [sales, ownerBranch, ownerPeriod, ownerDate, ownerMonth]);

  const ownerFilteredCosts = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA");
    return costs.filter(c => {
      const d = new Date(c.created_at).toLocaleDateString("en-CA");
      if (ownerBranch !== "all" && c.branch_id !== ownerBranch) return false;
      if (ownerPeriod === "today" && d !== today) return false;
      if (ownerPeriod === "month" && d.substring(0, 7) !== ownerMonth) return false;
      if (ownerPeriod === "custom" && d !== ownerDate) return false;
      return true;
    });
  }, [costs, ownerBranch, ownerPeriod, ownerDate, ownerMonth]);

  const periodRevenue = useMemo(() => ownerFilteredSales.reduce((s, i) => s + i.sale_amount, 0), [ownerFilteredSales]);
  const periodCost = useMemo(() => ownerFilteredCosts.reduce((s, i) => s + i.amount, 0), [ownerFilteredCosts]);
  const periodProfit = periodRevenue - periodCost;
  const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;

  const branchStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; revenue: number; cost: number }>();
    branches.forEach(b => map.set(b.id, { id: b.id, name: b.name, revenue: 0, cost: 0 }));
    ownerFilteredSales.forEach(s => {
      const key = s.branch_id ?? "__general__";
      const e = map.get(key) ?? { id: key, name: "General", revenue: 0, cost: 0 };
      map.set(key, { ...e, revenue: e.revenue + s.sale_amount });
    });
    ownerFilteredCosts.forEach(c => {
      const key = c.branch_id ?? "__general__";
      const e = map.get(key) ?? { id: key, name: "General", revenue: 0, cost: 0 };
      map.set(key, { ...e, cost: e.cost + c.amount });
    });
    return Array.from(map.values())
      .map(b => ({ ...b, profit: b.revenue - b.cost }))
      .filter(b => b.revenue > 0 || b.cost > 0)
      .sort((a, b) => b.profit - a.profit);
  }, [ownerFilteredSales, ownerFilteredCosts, branches]);

  const auditActiveDates = useMemo(() => {
    const s = new Set<string>();
    [...sales, ...costs].forEach(item => s.add(new Date(item.created_at).toLocaleDateString("en-CA")));
    return s;
  }, [sales, costs]);

  const periodLabel = ownerPeriod === "today"
    ? `Today, ${new Date().toLocaleDateString([], { month: "short", day: "numeric" })}`
    : ownerPeriod === "month"
      ? new Date(ownerMonth + "-15").toLocaleDateString([], { month: "long", year: "numeric" })
      : ownerPeriod === "custom"
        ? new Date(ownerDate + "T12:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
        : "All Time";

  // Audit Log: interleave sales + costs, apply date + branch + type + search filters
  const filteredLogs = [
    ...sales.map(s => ({ ...s, logType: "sale" as const })),
    ...costs.map(c => ({ ...c, logType: "cost" as const }))
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter(item => {
      // 0. Date filter
      if (new Date(item.created_at).toLocaleDateString("en-CA") !== auditDate) return false;
      // 1. Filter by branch
      if (auditBranchId !== "all" && item.branch_id !== auditBranchId) return false;
      // 2. Filter by type
      if (auditType === "sale" && item.logType !== "sale") return false;
      if (auditType === "cost" && item.logType !== "cost") return false;
      // 3. Filter by search query
      if (auditSearch.trim()) {
        const query = auditSearch.toLowerCase();
        if (item.logType === "sale") {
          const serviceName = getServiceName(item.service_id).toLowerCase();
          const therapistName = getTherapistName(item.employee_id).toLowerCase();
          return serviceName.includes(query) || therapistName.includes(query);
        } else {
          const category = item.cost_type.toLowerCase();
          const note = (item.note || "").toLowerCase();
          return category.includes(query) || note.includes(query);
        }
      }
      return true;
    });

  if (loading) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <div>
            <p className="section-label">Owner Consolidation</p>
            <h1>Initializing financial console...</h1>
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
            <p className="section-label" style={{ color: "#ff6464" }}>Error</p>
            <h1>Dashboard Unavailable</h1>
            <p className="dashboard-lead">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  // Shared inline styles
  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "12px", border: "1px solid var(--line)",
    background: "var(--surface-2)", padding: "0.75rem 0.95rem",
    color: "#fff", outline: "none",
  };

  return (
    <main className="page-shell">
      <section className="content-grid">
        
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <p className="section-label">Owner Console</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
            Beauty Intelligent Wellness Rollups
          </h1>
          <p className="dashboard-lead" style={{ marginTop: "8px" }}>
            Check consolidated revenues, cost, profit margins, and perform monthly payroll runs.
          </p>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--line)", marginBottom: "32px", paddingBottom: "2px" }}>
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{
              background: "none", border: "none",
              color: activeTab === "dashboard" ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "600",
              padding: "8px 16px", cursor: "pointer",
              borderBottom: activeTab === "dashboard" ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "all 0.2s ease"
            }}
          >
            Financials & Payroll
          </button>
          <button
            onClick={() => setActiveTab("crm")}
            style={{
              background: "none", border: "none",
              color: activeTab === "crm" ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "600",
              padding: "8px 16px", cursor: "pointer",
              borderBottom: activeTab === "crm" ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "all 0.2s ease"
            }}
          >
            Customer CRM Portal
          </button>
        </div>

        {activeTab === "dashboard" && (
          <>

        {/* ── Period & Branch Filter Bar ── */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Period Toggle */}
            <div style={{ display: "flex", gap: "3px", background: "var(--surface-2)", padding: "4px", borderRadius: "10px", border: "1px solid var(--line)" }}>
              {(["today", "month", "custom", "all"] as const).map(p => (
                <button key={p} onClick={() => setOwnerPeriod(p)} style={{
                  background: ownerPeriod === p ? "var(--accent)" : "none", border: "none",
                  borderRadius: "7px", color: ownerPeriod === p ? "#000" : "var(--muted)",
                  padding: "6px 14px", cursor: "pointer", fontSize: "0.83rem",
                  fontWeight: ownerPeriod === p ? 700 : 400, transition: "all 0.15s", whiteSpace: "nowrap",
                }}>
                  {p === "today" ? "Today" : p === "month" ? "This Month" : p === "custom" ? "Pick Date" : "All Time"}
                </button>
              ))}
            </div>

            {/* Month input */}
            {ownerPeriod === "month" && (
              <input type="month" value={ownerMonth} onChange={e => setOwnerMonth(e.target.value)}
                style={{ borderRadius: "10px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "6px 14px", color: "#fff", outline: "none", fontSize: "0.85rem" }}
              />
            )}

            {/* Branch Filter */}
            <select value={ownerBranch} onChange={e => setOwnerBranch(e.target.value)}
              style={{ borderRadius: "10px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "6px 14px", color: "#fff", outline: "none", fontSize: "0.85rem", cursor: "pointer" }}
            >
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            {/* Active period badge */}
            <span style={{ fontSize: "0.78rem", color: "var(--accent)", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "4px 12px", whiteSpace: "nowrap" }}>
              {periodLabel}
            </span>
          </div>

          {/* Calendar for Pick Date mode */}
          {ownerPeriod === "custom" && (
            <div style={{ marginTop: "16px" }}>
              <CalendarPicker value={ownerDate} onChange={setOwnerDate} activeDates={auditActiveDates} />
            </div>
          )}
        </div>

        {/* Financial Stat Cards */}
        <div className="stat-grid" style={{ margin: "0 0 32px" }}>
          <article className="stat-card" style={{ "--accent": "#C9A84C" } as React.CSSProperties}>
            <span className="stat-card__label">Period Revenue</span>
            <strong className="stat-card__value">{formatTaka(periodRevenue)}</strong>
            <p className="stat-card__detail">{periodLabel} · treatment sales.</p>
          </article>

          <article className="stat-card" style={{ "--accent": "#A07830" } as React.CSSProperties}>
            <span className="stat-card__label">Period Cost</span>
            <strong className="stat-card__value">{formatTaka(periodCost)}</strong>
            <p className="stat-card__detail">{periodLabel} · operational expenses.</p>
          </article>

          <article className="stat-card" style={{ "--accent": "#E8C96A" } as React.CSSProperties}>
            <span className="stat-card__label">Period Profit</span>
            <strong className="stat-card__value" style={{ color: periodProfit >= 0 ? "var(--accent-3)" : "#ff7c7c" }}>
              {formatTaka(periodProfit)}
            </strong>
            <p className="stat-card__detail">Net margin: {periodMargin.toFixed(1)}%</p>
          </article>

          <article className="stat-card" style={{ "--accent": "#C9A84C" } as React.CSSProperties}>
            <span className="stat-card__label">Active Branches</span>
            <strong className="stat-card__value">{branches.length}</strong>
            <p className="stat-card__detail">{ownerBranch === "all" ? "All branches combined" : getBranchName(ownerBranch)}</p>
          </article>
        </div>



        {/* Branch Operational Margins (period-filtered) */}
        <article className="glass-card" style={{ padding: "28px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: 0 }}>Branch Operational Margins</h2>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{periodLabel} · {ownerBranch === "all" ? "All Branches" : getBranchName(ownerBranch)}</span>
          </div>
          {branchStats.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: "0.95rem" }}>
              No data for the selected period and branch.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {branchStats.map((b) => {
                const profitPercent = b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0;
                const barWidth = periodRevenue > 0 ? (b.revenue / periodRevenue) * 100 : 0;
                return (
                  <div key={b.id} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", color: "#fff", display: "block" }}>{b.name}</strong>
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                          Revenue: {formatTaka(b.revenue)} · Expenses: {formatTaka(b.cost)}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ display: "block", fontSize: "1.2rem", color: b.profit >= 0 ? "var(--accent-3)" : "#ff7c7c" }}>
                          {formatTaka(b.profit)} profit
                        </strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--accent)" }}>
                          {profitPercent.toFixed(1)}% net margin
                        </span>
                      </div>
                    </div>
                    {/* Revenue share progress bar */}
                    <div style={{ height: "4px", background: "var(--surface-2)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barWidth}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-3))", borderRadius: "4px", transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* Daily Audit Log */}
        <article className="glass-card" style={{ padding: "28px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: 0 }}>Daily Audit Log</h2>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 10px", borderRadius: "8px", background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--accent)" }}>
              {filteredLogs.length} Entries
            </span>
          </div>

          {/* Two-column: Calendar + Filters + Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "24px", marginBottom: "24px", alignItems: "start" }}>

            {/* Left: Calendar */}
            <CalendarPicker value={auditDate} onChange={setAuditDate} activeDates={auditActiveDates} />

            {/* Right: Summary + Filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Date summary bar */}
              <div style={{ padding: "10px 16px", borderRadius: "10px", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600 }}>
                  {new Date(auditDate + "T12:00:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Daily totals (only if entries exist) */}
              {filteredLogs.length > 0 && (() => {
                const dayRev = filteredLogs.filter(i => i.logType === "sale").reduce((s, i) => s + i.sale_amount, 0);
                const dayCost = filteredLogs.filter(i => i.logType === "cost").reduce((s, i) => s + i.amount, 0);
                const dayNet = dayRev - dayCost;
                return (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--accent)", display: "block" }}>Revenue</span>
                      <strong style={{ color: "var(--accent-3)", fontSize: "0.92rem" }}>+৳{dayRev.toLocaleString()}</strong>
                    </div>
                    <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(255,100,100,0.06)", border: "1px solid rgba(255,100,100,0.15)" }}>
                      <span style={{ fontSize: "0.7rem", color: "#ff7c7c", display: "block" }}>Expenses</span>
                      <strong style={{ color: "#ff7c7c", fontSize: "0.92rem" }}>-৳{dayCost.toLocaleString()}</strong>
                    </div>
                    <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block" }}>Net</span>
                      <strong style={{ color: dayNet >= 0 ? "var(--accent-3)" : "#ff7c7c", fontSize: "0.92rem" }}>৳{dayNet.toLocaleString()}</strong>
                    </div>
                  </div>
                );
              })()}

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Filter by Branch</span>
                <select value={auditBranchId} onChange={(e) => setAuditBranchId(e.target.value)}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.75rem 0.95rem", color: "#fff", outline: "none" }}
                >
                  <option value="all">All Branches</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Log Type</span>
                <select value={auditType} onChange={(e) => setAuditType(e.target.value)}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.75rem 0.95rem", color: "#fff", outline: "none" }}
                >
                  <option value="all">All Entries</option>
                  <option value="sale">Sales (Treatments Only)</option>
                  <option value="cost">Expenses Only</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Search logs</span>
                <input type="text" placeholder="Search by therapist, service, category, or note..."
                  value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.75rem 0.95rem", color: "#fff", outline: "none" }}
                />
              </label>
            </div>
          </div>

          {/* Audit Logs list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredLogs.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: "0.95rem" }}>
                No sales or expense entries found matching current criteria.
              </p>
            ) : (
              filteredLogs.map((item) => {
                const isSale = item.logType === "sale";
                const dateObj = new Date(item.created_at);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      background: isSale ? "rgba(110, 231, 255, 0.02)" : "rgba(255, 100, 100, 0.02)",
                      border: `1px solid ${isSale ? "rgba(110, 231, 255, 0.08)" : "rgba(255, 100, 100, 0.08)"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "14px",
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "0.68rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          background: isSale ? "rgba(110, 231, 255, 0.1)" : "rgba(255, 100, 100, 0.1)",
                          color: isSale ? "var(--accent)" : "#ff7c7c",
                          border: `1px solid ${isSale ? "rgba(110, 231, 255, 0.15)" : "rgba(255, 100, 100, 0.15)"}`
                        }}>
                          {isSale ? "Treatment Sale" : "Clinic Expense"}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                          {getBranchName(item.branch_id)}
                        </span>
                      </div>
                      <strong style={{ fontSize: "1.05rem", color: "#fff", marginTop: "2px" }}>
                        {isSale ? getServiceName(item.service_id) : item.cost_type}
                      </strong>
                      <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                        {isSale 
                          ? `Performed by: ${getTherapistNames(item as Sale)}`
                          : item.note || "No details provided"
                        }
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                        {timeStr} — {dateStr}
                      </span>
                    </div>
                    
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "1.25rem", color: isSale ? "var(--accent-3)" : "#ff7c7c" }}>
                        {isSale ? `+৳${item.sale_amount.toLocaleString()}` : `-৳${item.amount.toLocaleString()}`}
                      </strong>
                      {isSale && item.discount_amount > 0 && (
                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                          (৳{item.discount_amount.toLocaleString()} discount applied)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        {/* Payroll Consolidation and Calculation Portal */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
          
          {/* Payroll Calc View */}
          <article className="glass-card" style={{ padding: "28px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 8px", color: "var(--accent)" }}>Payroll Console</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 20px" }}>
              Compute monthly salaries, therapy bonuses, and sales commissions for clinic staff.
            </p>

            {/* Selector controls */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ display: "grid", gap: "6px", flex: 1 }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Select Branch</span>
                <select
                  value={payrollBranchId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setPayrollBranchId(e.target.value)}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.75rem 0.95rem", color: "#fff", outline: "none" }}
                >
                  {branches.map((b: Branch) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: "6px", flex: 1 }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Payroll Month</span>
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPayrollMonth(e.target.value)}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.75rem 0.95rem", color: "#fff", outline: "none", font: "inherit" }}
                />
              </label>

              <button
                onClick={handleCalculatePayroll}
                disabled={calcLoading}
                className="button button--primary"
                style={{ padding: "0.75rem 1.4rem", height: "48px" }}
              >
                {calcLoading ? "Computing..." : "Calculate Payroll"}
              </button>
            </div>

            {/* Results breakdown */}
            {calcError && (
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 100, 100, 0.1)", color: "#ff7373", fontSize: "0.86rem", marginBottom: "16px" }}>
                {calcError}
              </div>
            )}
            
            {commitSuccess && (
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(142, 240, 178, 0.1)", color: "#92fb9c", fontSize: "0.86rem", marginBottom: "16px" }}>
                Payroll run has been committed and locked in the database!
              </div>
            )}

            {calculatedPayroll && (
              <div style={{ display: "grid", gap: "20px" }}>
                <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(110, 231, 255, 0.04)", border: "1px solid rgba(110, 231, 255, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "1.1rem", color: "#fff" }}>Consolidation Summary</strong>
                    <div style={{ fontSize: "0.84rem", color: "var(--muted)", marginTop: "4px" }}>
                      Salaries: ৳{calculatedPayroll.salary_total.toLocaleString()} • Bonuses: ৳{calculatedPayroll.bonus_total.toLocaleString()} • Commissions: ৳{calculatedPayroll.commission_total.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Total Run Cost</div>
                    <strong style={{ fontSize: "1.45rem", color: "var(--accent)" }}>৳{calculatedPayroll.total_payroll.toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "0.84rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee Payroll Breakdown</span>
                  {calculatedPayroll.employees.map((emp) => (
                    <div
                      key={emp.employee_id}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.01)",
                        border: "1px solid var(--line)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ color: "#fff", fontSize: "0.95rem" }}>{emp.full_name}</strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>
                          {emp.role} • {emp.treatment_count} treatments
                        </span>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <strong style={{ color: "var(--accent-3)" }}>৳{emp.total_earned.toLocaleString()}</strong>
                        <span style={{ fontSize: "0.76rem", color: "var(--muted)", display: "block" }}>
                          (৳{emp.base_salary.toLocaleString()} base + ৳{(emp.bonus_earned + emp.commission_earned).toLocaleString()} earn)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    onClick={handleCommitPayroll}
                    disabled={commitLoading}
                    className="button button--primary"
                    style={{ padding: "0.75rem 1.6rem" }}
                  >
                    {commitLoading ? "Locking..." : "Lock & Commit Payroll Run"}
                  </button>
                </div>
              </div>
            )}
          </article>

          {/* Payroll History */}
          <article className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 16px", color: "var(--accent-2)" }}>Payroll Run History</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1 }}>
              {payrollHistory.length === 0 ? (
                <p style={{ color: "var(--muted)", textAlign: "center", fontSize: "0.9rem", padding: "30px 0" }}>
                  No historical payroll runs locked yet.
                </p>
              ) : (
                payrollHistory.map((run) => (
                  <div
                    key={run.id}
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      background: "rgba(255, 255, 255, 0.01)",
                      border: "1px solid var(--line)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ color: "#fff" }}>{getBranchName(run.branch_id)}</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "600" }}>{run.month}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                        Base: ৳{run.salary_total.toLocaleString()} • Earned: ৳{(run.bonus_total + run.commission_total).toLocaleString()}
                      </span>
                      <strong style={{ color: "var(--accent-3)", fontSize: "1.05rem" }}>
                        ৳{(run.salary_total + run.bonus_total + run.commission_total).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

        </div>
      </>
    )}

    {activeTab === "crm" && (
      <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* CRM Search & Action Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: "1 1 300px" }}>
            <input
              type="text"
              placeholder="Search customer directory by name or phone..."
              value={crmSearchQuery}
              onChange={(e) => setCrmSearchQuery(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            onClick={() => setShowCrmAddForm(!showCrmAddForm)}
            className="button button--primary"
            style={{ padding: "0.75rem 1.5rem" }}
          >
            {showCrmAddForm ? "Close Form" : "＋ Register Customer"}
          </button>
        </div>

        {/* Inline Customer Add Form */}
        {showCrmAddForm && (
          <article className="glass-card" style={{ padding: "28px", border: "1px solid rgba(142, 240, 178, 0.2)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", margin: "0 0 16px", color: "var(--accent-3)" }}>
              Register New Client Record
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Full Name *</span>
                <input
                  type="text" required
                  value={newCrmName}
                  onChange={(e) => setNewCrmName(e.target.value)}
                  placeholder="e.g. Asif Mahmud"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Phone Number *</span>
                <input
                  type="text" required
                  value={newCrmPhone}
                  onChange={(e) => setNewCrmPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  style={inputStyle}
                />
              </label>
            </div>
            <div style={{ display: "grid", gap: "16px", marginBottom: "20px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Email Address</span>
                <input
                  type="email"
                  value={newCrmEmail}
                  onChange={(e) => setNewCrmEmail(e.target.value)}
                  placeholder="e.g. client@domain.com"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Consultation / Profile Notes</span>
                <textarea
                  value={newCrmNotes}
                  onChange={(e) => setNewCrmNotes(e.target.value)}
                  placeholder="Describe skin condition, treatment goals, allergies, or past treatments..."
                  rows={3}
                  style={{ ...inputStyle, resize: "none", font: "inherit" }}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCrmAddForm(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCrmCustomer}
                disabled={crmCustCreating || !newCrmName || !newCrmPhone}
                className="button button--primary"
                style={{ padding: "0.75rem 1.6rem" }}
              >
                {crmCustCreating ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </article>
        )}

        {/* CRM Two Column Directory */}
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "24px" }}>
          
          {/* Left Column: Customer Directory List */}
          <article className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", maxHeight: "650px" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", margin: "0 0 16px" }}>Client Directory</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              {customers
                .filter(c => {
                  const query = crmSearchQuery.toLowerCase();
                  return c.full_name.toLowerCase().includes(query) || c.phone.includes(query);
                })
                .map(c => {
                  const clientSales = sales.filter(s => s.customer_id === c.id);
                  const totalSpent = clientSales.reduce((acc, curr) => acc + curr.sale_amount, 0);
                  const isSelected = selectedCrmCustomer?.id === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCrmCustomer(c)}
                      style={{
                        padding: "16px",
                        borderRadius: "16px",
                        background: isSelected ? "rgba(110, 231, 255, 0.06)" : "rgba(255, 255, 255, 0.01)",
                        border: `1px solid ${isSelected ? "rgba(110, 231, 255, 0.25)" : "var(--line)"}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "1.05rem", color: isSelected ? "var(--accent)" : "#fff" }}>
                        {c.full_name}
                      </strong>
                      <span style={{ fontSize: "0.82rem", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                        {c.phone} {c.email ? `• ${c.email}` : ""}
                      </span>
                      <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                        <span style={{ fontSize: "0.72rem", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: "6px", color: "var(--muted)" }}>
                          {clientSales.length} Treatments
                        </span>
                        <span style={{ fontSize: "0.72rem", background: "rgba(110, 231, 255, 0.08)", padding: "2px 8px", borderRadius: "6px", color: "var(--accent)" }}>
                          ৳{totalSpent.toLocaleString()} Spent
                        </span>
                      </div>
                    </div>
                  );
                })}
              {customers.filter(c => {
                const query = crmSearchQuery.toLowerCase();
                return c.full_name.toLowerCase().includes(query) || c.phone.includes(query);
              }).length === 0 && (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: "0.95rem" }}>
                  No clients found in directory.
                </p>
              )}
            </div>
          </article>

          {/* Right Column: Customer Details & Treatment History */}
          <article className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", minHeight: "500px" }}>
            {selectedCrmCustomer ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
                
                <div>
                  <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderRadius: "6px", background: "rgba(110,231,255,0.06)", border: "1px solid rgba(110,231,255,0.15)", color: "var(--accent)" }}>
                    Client Profile
                  </span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", margin: "10px 0 4px", color: "#fff" }}>
                    {selectedCrmCustomer.full_name}
                  </h3>
                  <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
                    Contact: {selectedCrmCustomer.phone} {selectedCrmCustomer.email ? `• ${selectedCrmCustomer.email}` : ""}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Lifetime Spent</span>
                    <strong style={{ fontSize: "1.2rem", color: "var(--accent-3)" }}>
                      ৳{sales.filter(s => s.customer_id === selectedCrmCustomer.id).reduce((acc, curr) => acc + curr.sale_amount, 0).toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Total Visits</span>
                    <strong style={{ fontSize: "1.2rem", color: "#fff" }}>
                      {sales.filter(s => s.customer_id === selectedCrmCustomer.id).length}
                    </strong>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Avg. Treatment Ticket</span>
                    <strong style={{ fontSize: "1.2rem", color: "var(--accent)" }}>
                      ৳{(() => {
                        const clientSales = sales.filter(s => s.customer_id === selectedCrmCustomer.id);
                        if (clientSales.length === 0) return 0;
                        const total = clientSales.reduce((acc, curr) => acc + curr.sale_amount, 0);
                        return Math.round(total / clientSales.length);
                      })().toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: "0.88rem", color: "#fff", display: "block", marginBottom: "8px" }}>
                    Consultation & Profile Notes
                  </strong>
                  <div style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    minHeight: "80px",
                    whiteSpace: "pre-wrap"
                  }}>
                    {selectedCrmCustomer.notes || "No notes registered for this client."}
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#fff", display: "block", marginBottom: "12px" }}>
                    Treatment & Purchase History
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1, maxHeight: "300px" }}>
                    {sales.filter(s => s.customer_id === selectedCrmCustomer.id).length === 0 ? (
                      <p style={{ color: "var(--muted)", padding: "30px 0", fontSize: "0.88rem", textAlign: "center" }}>
                        No treatments recorded for this client yet.
                      </p>
                    ) : (
                      sales
                        .filter(s => s.customer_id === selectedCrmCustomer.id)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map(sale => (
                          <div
                            key={sale.id}
                            style={{
                              padding: "14px",
                              borderRadius: "14px",
                              background: "rgba(255, 255, 255, 0.01)",
                              border: "1px solid var(--line)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div>
                              <strong style={{ color: "#fff", fontSize: "0.95rem" }}>{getServiceName(sale.service_id)}</strong>
                              <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                                Staff: {getTherapistNames(sale)} • {new Date(sale.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <strong style={{ color: "var(--accent-3)", fontSize: "1.05rem" }}>
                              +৳{sale.sale_amount.toLocaleString()}
                            </strong>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--muted)" }}>
                <p style={{ fontSize: "0.95rem" }}>Select a client from the directory to track details.</p>
              </div>
            )}
          </article>

        </div>
      </section>
    )}

      </section>
    </main>
  );
}