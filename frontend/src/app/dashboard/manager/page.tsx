/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { CrmPortal } from "@/components/crm-portal";
import { AppointmentsView } from "@/components/appointments-view";

import { useEffect, useState, useRef, useMemo, ChangeEvent, FormEvent } from "react";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { InteractiveChart } from "@/components/interactive-chart";
import { CalendarPicker } from "@/components/calendar-picker";

type Employee = {
  id: string;
  user_id?: string | null;
  branch_id: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
};

type Service = {
  id: string;
  branch_id: string | null;
  name: string;
  price: number;
  cost: number;
};

type CustomerResult = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
};

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
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

type BranchTarget = {
  id: string;
  branch_id: string;
  month: string;
  target_amount: number;
};

type ManagerProfile = {
  employee_id: string;
  full_name: string;
  role: string;
  branch_id: string | null;
};

type AttendanceRecordType = {
  employee_id: string;
  full_name?: string;
  role?: string;
  date: string;
  status: string;
  deduction_amount: number;
  clock_in_time: string | null;
  clock_out_time: string | null;
  overtime_minutes: number;
};

export default function ManagerDashboardPage() {
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [employeeRecord, setEmployeeRecord] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time Punch State
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchSubmitting, setPunchSubmitting] = useState(false);
  const [todaysPunch, setTodaysPunch] = useState<AttendanceRecordType | null>(null);

  // Daily Roster State
  const [rosterDate, setRosterDate] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [roster, setRoster] = useState<AttendanceRecordType[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Sale Logger Form State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [saleServiceId, setSaleServiceId] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState(false);

  // Chart Data State
  const [dailyChartData, setDailyChartData] = useState<{
    daily_trend: { date: string; sales: number; costs: number; profit: number }[];
    average_daily_sales: number;
    total_sales: number;
    total_costs: number;
    profit_margin: number;
  } | null>(null);

  // Customer State
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [custCreating, setCustCreating] = useState(false);
  const customerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CRM Tab States
  const [activeTab, setActiveTab] = useState<"operations" | "crm" | "appointments">("operations");
  const [logDate, setLogDate] = useState<string>(new Date().toLocaleDateString("en-CA")); // YYYY-MM-DD in local time

  const [activeDatesData, setActiveDatesData] = useState<string[]>([]);
  // Compute active dates for calendar dot indicators
  const activeDates = useMemo(() => new Set(activeDatesData), [activeDatesData]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCrmCustomer, setSelectedCrmCustomer] = useState<Customer | null>(null);
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [showCrmAddForm, setShowCrmAddForm] = useState(false);
  const [newCrmName, setNewCrmName] = useState("");
  const [newCrmPhone, setNewCrmPhone] = useState("");
  const [newCrmEmail, setNewCrmEmail] = useState("");
  const [newCrmNotes, setNewCrmNotes] = useState("");
  const [crmCustCreating, setCrmCustCreating] = useState(false);

  // Cost Logger Form State
  const [costType, setCostType] = useState("Medical Supplies");
  const [costAmount, setCostAmount] = useState("");
  const [costNote, setCostNote] = useState("");
  const [costSubmitting, setCostSubmitting] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);
  const [costSuccess, setCostSuccess] = useState(false);

  // New Features States
  const [branchTarget, setBranchTarget] = useState<BranchTarget | null>(null);

  const [attEmployeeId, setAttEmployeeId] = useState("");
  const [attStatus, setAttStatus] = useState("Late");
  const [attDeduction, setAttDeduction] = useState("0");
  const [attSubmitting, setAttSubmitting] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [attSuccess, setAttSuccess] = useState(false);

  const [revEmployeeId, setRevEmployeeId] = useState("");
  const [revRating, setRevRating] = useState("5");
  const [revText, setRevText] = useState("");
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revError, setRevError] = useState<string | null>(null);
  const [revSuccess, setRevSuccess] = useState(false);

  // Refs for click-outside
  const empDropdownRef = useRef<HTMLDivElement>(null);
  const custDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target as Node)) {
        setShowEmpDropdown(false);
      }
      if (custDropdownRef.current && !custDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadManagerData = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("No active Supabase session found. Please log in.");
        }

        const base = getApiBaseUrl();
        const currentMonth = new Date().toISOString().substring(0, 7);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let profileData: any = null;
        let managerBranchId = null;
        let allEmps: Employee[] = [];

        const profileRes = await authFetch(`${base}/api/v1/payroll/employee/user/${user.id}?month=${currentMonth}`);
        if (profileRes.ok) {
          profileData = await profileRes.json();
        } else {
          console.warn("No employee profile found for this manager account.");
        }

        const empDetailRes = await authFetch(`${base}/api/v1/employees`);
        if (empDetailRes.ok) {
          allEmps = await empDetailRes.json();
          // Find the manager's true employee record by user_id
          const me = allEmps.find((e) => e.user_id === user.id);
          if (me) {
            setEmployeeRecord(me);
            managerBranchId = me.branch_id;
          }
          
          if (profileData) {
            setProfile({
              employee_id: profileData.employee_id,
              full_name: profileData.full_name,
              role: profileData.role,
              branch_id: managerBranchId
            });
          }
        }

        // Fetch Branch Targets, Services, Sales, Costs, and Analytics
        const [servicesRes, salesRes, costsRes, dailyChartRes, customersRes, targetsRes, activeDatesRes] = await Promise.all([
          authFetch(`${base}/api/v1/services`),
          authFetch(`${base}/api/v1/sales?limit=50`),
          authFetch(`${base}/api/v1/costs?limit=50`),
          authFetch(`${base}/api/v1/overview/daily-chart?branch_id=${managerBranchId || ""}`),
          authFetch(`${base}/api/v1/customers?limit=50`),
          authFetch(`${base}/api/v1/targets${managerBranchId ? `?branch_id=${managerBranchId}` : ""}`),
          authFetch(`${base}/api/v1/overview/active-dates`)
        ]);

        if (!servicesRes.ok || !salesRes.ok || !costsRes.ok || !dailyChartRes.ok || !customersRes.ok || !targetsRes.ok || !activeDatesRes.ok) {
          throw new Error("Failed to load operations catalogs.");
        }

        const servicesData: Service[] = await servicesRes.json();
        const salesData: Sale[] = await salesRes.json();
        const costsData: CostEntry[] = await costsRes.json();
        const dailyChartDataVal = await dailyChartRes.json();
        const customersData: Customer[] = await customersRes.json();
        const targetsData: BranchTarget[] = await targetsRes.json();

        // Set target for current month
        const currentTarget = targetsData.find(t => t.month === currentMonth);
        if (currentTarget) setBranchTarget(currentTarget);

        const activeTherapists = allEmps.filter(e => e.is_active && e.id !== profileData.employee_id);
        setEmployees(activeTherapists);
        if (activeTherapists.length > 0) {
          setAttEmployeeId(activeTherapists[0].id);
          setRevEmployeeId(activeTherapists[0].id);
        }

        const branchServices = servicesData;
        setServices(branchServices);
        if (branchServices.length > 0) {
          setSaleServiceId(branchServices[0].id);
        }

        const branchSales = managerBranchId ? salesData.filter(s => s.branch_id === managerBranchId) : salesData;
        const branchCosts = managerBranchId ? costsData.filter(c => c.branch_id === managerBranchId) : costsData;
        setSales(branchSales);
        setCosts(branchCosts);
        setDailyChartData(dailyChartDataVal);
        setCustomers(customersData);
        if (activeDatesRes.ok) setActiveDatesData(await activeDatesRes.json());

        // Fetch Manager's Punch status for today
        const todayStr = new Date().toLocaleDateString("en-CA");
        const attRes = await authFetch(`${base}/api/v1/attendance?employee_id=${profileData.employee_id}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const todaysRecords = attData.filter((a: AttendanceRecordType) => a.date === todayStr);
          const latestPunch = todaysRecords.length > 0 ? todaysRecords[0] : null;
          setTodaysPunch(latestPunch);
          setIsPunchedIn(!!(latestPunch && !latestPunch.clock_out_time));
        }

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    loadManagerData();
  }, []);

  // Fetch Sales when logDate changes
  useEffect(() => {
    if (!profile?.branch_id || !logDate) return;
    const fetchDayLogs = async () => {
      try {
        const [salesRes, costsRes] = await Promise.all([
          authFetch(`${getApiBaseUrl()}/api/v1/sales?date=${logDate}&limit=200`),
          authFetch(`${getApiBaseUrl()}/api/v1/costs?date=${logDate}&limit=200`)
        ]);
        if (salesRes.ok) {
           const sData = await salesRes.json();
           setSales(sData.filter((s: Sale) => s.branch_id === profile.branch_id));
        }
        if (costsRes.ok) {
           const cData = await costsRes.json();
           setCosts(cData.filter((c: CostEntry) => c.branch_id === profile.branch_id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDayLogs();
  }, [logDate, profile?.branch_id]);

  // Fetch Roster when rosterDate changes
  useEffect(() => {
    if (!profile?.branch_id) return;
    const fetchRoster = async () => {
      setRosterLoading(true);
      try {
        const res = await authFetch(`${getApiBaseUrl()}/api/v1/attendance/daily?date=${rosterDate}&branch_id=${profile.branch_id}`);
        if (res.ok) {
          const data = await res.json();
          setRoster(data);
        }
      } catch (err) {
        console.error("Failed to load roster", err);
      } finally {
        setRosterLoading(false);
      }
    };
    fetchRoster();

    const channel = getSupabaseBrowserClient()
      .channel('public:attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log("Realtime roster update!", payload);
          fetchRoster();
        }
      )
      .subscribe();

    return () => {
      getSupabaseBrowserClient().removeChannel(channel);
    };
  }, [rosterDate, profile?.branch_id]);

  // ── Employee multi-select helpers ──
  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const removeEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev => prev.filter(id => id !== empId));
  };

  // ── Customer search with debounce ──
  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    setSelectedCustomer(null);
    setShowNewCustomer(false);

    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);

    if (value.trim().length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    customerSearchTimer.current = setTimeout(async () => {
      try {
        const res = await authFetch(`${getApiBaseUrl()}/api/v1/customers/search?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const results = await res.json();
          setCustomerResults(results);
          setShowCustomerDropdown(true);
        }
      } catch {
        /* silent */
      }
    }, 300);
  };

  const selectCustomer = (c: CustomerResult) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.full_name);
    setShowCustomerDropdown(false);
    setShowNewCustomer(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustName || !newCustPhone) return;
    setCustCreating(true);
    try {
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: newCustName, phone: newCustPhone, email: newCustEmail || null }),
      });
      if (!res.ok) throw new Error("Failed to create customer.");
      const newCust = await res.json();
      
      // Append to the list of loaded customers
      setCustomers(prev => [newCust as Customer, ...prev]);
      
      selectCustomer(newCust);
      setShowNewCustomer(false);
      setNewCustName(""); setNewCustPhone(""); setNewCustEmail("");
    } catch {
      alert("Failed to create customer.");
    } finally {
      setCustCreating(false);
    }
  };

  const handleCreateCrmCustomer = async () => {
    if (!newCrmName || !newCrmPhone) return;
    setCrmCustCreating(true);
    try {
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/customers`, {
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

  const handleServiceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSaleServiceId(e.target.value);
  };

  const handleRecordTreatment = async (e: FormEvent) => {
    e.preventDefault();
    setSaleSubmitting(true);
    setSaleError(null);
    setSaleSuccess(false);

    if (selectedEmployeeIds.length === 0) {
      setSaleError("Please select at least one therapist.");
      setSaleSubmitting(false);
      return;
    }
    if (!saleServiceId) {
      setSaleError("Please select a service.");
      setSaleSubmitting(false);
      return;
    }

    const service = services.find(s => s.id === saleServiceId);
    const servicePrice = service ? service.price : 0;
    const finalSaleAmount = servicePrice - (parseFloat(discountAmount) || 0);

    const payload = {
      branch_id: profile?.branch_id || null,
      service_id: saleServiceId,
      employee_ids: selectedEmployeeIds,
      customer_id: selectedCustomer?.id || null,
      sale_amount: finalSaleAmount,
      discount_amount: parseFloat(discountAmount) || 0,
      payment_method: paymentMethod,
    };

    try {
      const base = getApiBaseUrl();
      const res = await authFetch(`${base}/api/v1/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to log treatment sale.");
      }

      const loggedSale = await res.json();
      setSales(prev => [loggedSale, ...prev]);

      // Re-fetch daily chart so dashboard graphs update in realtime
      const chartRes = await authFetch(`${base}/api/v1/overview/daily-chart?branch_id=${profile?.branch_id || ""}`);
      if (chartRes.ok) {
        setDailyChartData(await chartRes.json());
      }

      setDiscountAmount("0");
      setSelectedEmployeeIds([]);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setSaleSuccess(true);
      setTimeout(() => setSaleSuccess(false), 3000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setSaleError(errMsg);
    } finally {
      setSaleSubmitting(false);
    }
  };

  const handleLogExpense = async (e: FormEvent) => {
    e.preventDefault();
    setCostSubmitting(true);
    setCostError(null);
    setCostSuccess(false);

    if (!costAmount) {
      setCostError("Please specify the expense amount.");
      setCostSubmitting(false);
      return;
    }

    const payload = {
      branch_id: profile?.branch_id || null,
      cost_type: costType,
      amount: parseFloat(costAmount) || 0,
      note: costNote || null
    };

    try {
      const base = getApiBaseUrl();
      const res = await authFetch(`${base}/api/v1/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to record expense.");
      }

      const loggedCost = await res.json();
      setCosts(prev => [loggedCost, ...prev]);

      setCostAmount("");
      setCostNote("");
      setCostSuccess(true);
      setTimeout(() => setCostSuccess(false), 3000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setCostError(errMsg);
    } finally {
      setCostSubmitting(false);
    }
  };

  const handleLogAttendance = async (e: FormEvent) => {
    e.preventDefault();
    setAttSubmitting(true);
    setAttError(null);
    setAttSuccess(false);

    const payload = {
      employee_id: attEmployeeId,
      date: logDate,
      status: attStatus,
      deduction_amount: parseFloat(attDeduction) || 0
    };

    try {
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to log attendance");
      setAttSuccess(true);
      setTimeout(() => setAttSuccess(false), 3000);
    } catch (err) {
      setAttError(err instanceof Error ? err.message : String(err));
    } finally {
      setAttSubmitting(false);
    }
  };

  const handlePunch = async () => {
    if (!profile) return;
    setPunchSubmitting(true);
    try {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/attendance/punch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: profile.employee_id, date: todayStr })
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

  const handleLogReview = async (e: FormEvent) => {
    e.preventDefault();
    setRevSubmitting(true);
    setRevError(null);
    setRevSuccess(false);

    if (!selectedCrmCustomer) {
      setRevError("Please select a customer first.");
      setRevSubmitting(false);
      return;
    }

    const payload = {
      branch_id: profile?.branch_id || null,
      customer_id: selectedCrmCustomer.id,
      employee_id: revEmployeeId,
      rating: parseInt(revRating),
      review_text: revText
    };

    try {
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to log review");
      setRevSuccess(true);
      setRevText("");
      setTimeout(() => setRevSuccess(false), 3000);
    } catch (err) {
      setRevError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevSubmitting(false);
    }
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

  // Shared inline styles
  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "8px", border: "1px solid var(--border)",
    background: "var(--surface-2)", padding: "0.75rem 0.95rem",
    color: "var(--text)", outline: "none", colorScheme: "light",
  };
  const selectInputStyle: React.CSSProperties = {
    ...inputStyle, background: "var(--surface-2)",
  };

  if (loading) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <div>
            <p className="section-label">Manager Workspace</p>
            <h1>Initializing branch dashboard...</h1>
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
            <p className="section-label" style={{ color: "#ff6464" }}>Error Loading Profile</p>
            <h1>Access Denied</h1>
            <p className="dashboard-lead">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="content-grid">

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <p className="section-label">Branch Workspace</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
            Welcome back, {profile?.full_name || "Manager"}
          </h1>
          <p className="dashboard-lead" style={{ marginTop: "8px" }}>
            Record client treatments, track branch operations, and manage customer records.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="mobile-scroll" style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--line)", marginBottom: "32px", paddingBottom: "2px" }}>
          <button
            onClick={() => setActiveTab("operations")}
            style={{
              background: "none", border: "none",
              color: activeTab === "operations" ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "600",
              padding: "8px 16px", cursor: "pointer",
              borderBottom: activeTab === "operations" ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "all 0.2s ease"
            }}
          >
            Operations & Recording
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
          <button
            onClick={() => setActiveTab("appointments")}
            style={{
              background: "none", border: "none",
              color: activeTab === "appointments" ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "600",
              padding: "8px 16px", cursor: "pointer",
              borderBottom: activeTab === "appointments" ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "all 0.2s ease"
            }}
          >
            Appointments
          </button>
        </div>

        {activeTab === "operations" && (
          <>
            {/* Daily Operations Trend Chart (Branch Specific) */}
            <article className="glass-card" style={{ padding: "28px", marginBottom: "32px", display: "flex", flexDirection: "column" }}>
              <div className="mobile-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: 0 }}>Daily Operations Trend</h2>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                    Day-by-day sales vs. daily costs for your branch over the last 30 days.
                  </p>
                </div>
                {dailyChartData && (
                  <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "var(--accent)" }}>Monthly Sales</span>
                      <strong style={{ display: "block", fontSize: "1.15rem", color: "var(--accent-3)", fontFamily: "monospace" }}>
                        ৳{dailyChartData.total_sales.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Net Margin</span>
                      <strong style={{ display: "block", fontSize: "1.15rem", color: "var(--text)", fontFamily: "monospace" }}>
                        {dailyChartData.profit_margin.toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: "auto" }}>
                {dailyChartData ? (
                  <InteractiveChart
                    data={dailyChartData.daily_trend}
                    xAxisKey="date"
                    series={[
                      { key: "sales", label: "Daily Sales", strokeColor: "#C9A84C", fillGradientStart: "#C9A84C", fillGradientEnd: "rgba(201,168,76,0)" },
                      { key: "costs", label: "Daily Costs", strokeColor: "#ff7c7c", fillGradientStart: "#ff7c7c", fillGradientEnd: "rgba(255,124,124,0)" },
                    ]}
                    valueFormatter={(v) => `৳${v.toLocaleString()}`}
                  />
                ) : (
                  <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>Loading operations trend...</p>
                )}
              </div>
            </article>

            {/* Time Punch Card */}
            <article className="glass-card" style={{ padding: "24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", border: isPunchedIn ? "1px solid rgba(142, 240, 178, 0.4)" : "1px solid var(--line)" }}>
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

            {/* Manager Personal Payroll Summary */}
            {(employeeRecord || profile) && (() => {
              const currentRevenue = sales.reduce((sum, s) => sum + s.sale_amount, 0);
              const targetAmount = branchTarget?.target_amount || 0;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const emp = employeeRecord as any;
              const commissionRate = emp?.commission_rate || 0;
              const baseSalary = emp?.salary || 0;
              const commissionEarned = currentRevenue > targetAmount && targetAmount > 0
                ? (currentRevenue - targetAmount) * (commissionRate / 100)
                : 0;
              return (
                <article className="glass-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center mb-6" style={{ padding: "20px 24px", borderColor: "rgba(201,168,76,0.2)" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Base Salary</span>
                    <strong style={{ fontSize: "1.15rem", color: "var(--text)", fontFamily: "monospace" }}>৳{baseSalary.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Commission Rate</span>
                    <strong style={{ fontSize: "1.15rem", color: "var(--accent)", fontFamily: "monospace" }}>{commissionRate}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Commission Earned</span>
                    <strong style={{ fontSize: "1.15rem", color: commissionEarned > 0 ? "var(--accent-3)" : "var(--muted)", fontFamily: "monospace" }}>৳{commissionEarned.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Est. Total This Month</span>
                    <strong style={{ fontSize: "1.15rem", color: "var(--accent-3)", fontFamily: "monospace" }}>৳{(baseSalary + commissionEarned).toLocaleString()}</strong>
                  </div>
                </article>
              );
            })()}

            {/* Daily Roster Card */}

            <article className="glass-card" style={{ padding: "28px", marginBottom: "32px" }}>
              <div className="mobile-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: 0 }}>Daily Attendance Roster</h2>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>View who was present, absent, or on leave for any specific date.</p>
                </div>
                <div>
                  <input
                    type="date"
                    value={rosterDate}
                    onChange={(e) => setRosterDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {rosterLoading ? (
                <p style={{ color: "var(--muted)", textAlign: "center" }}>Loading roster...</p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {roster.map((r: AttendanceRecordType) => (
                    <div key={r.employee_id} style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "rgba(0, 0, 0,0.02)", border: "1px solid var(--line)", borderRadius: "12px" }}>
                      <div>
                        <strong style={{ display: "block", color: "var(--text)" }}>{r.full_name} <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: "normal" }}>({r.role})</span></strong>
                        <span style={{ fontSize: "0.8rem", color: r.status === "Present" ? "#92fb9c" : r.status === "Absent" ? "#ff7c7c" : "var(--accent)" }}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {r.clock_in_time && <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>In: {new Date(r.clock_in_time).toLocaleTimeString()}</div>}
                        {r.clock_out_time && <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Out: {new Date(r.clock_out_time).toLocaleTimeString()}</div>}
                        {r.overtime_minutes > 0 && <div style={{ fontSize: "0.85rem", color: "var(--gold-light)" }}>Overtime: {(r.overtime_minutes / 60).toFixed(1)} hrs</div>}
                        {r.deduction_amount > 0 && <div style={{ fontSize: "0.85rem", color: "#ff7c7c" }}>Deduction: ৳{r.deduction_amount}</div>}
                      </div>
                    </div>
                  ))}
                  {roster.length === 0 && <p style={{ color: "var(--muted)", textAlign: "center" }}>No employees found for this branch.</p>}
                </div>
              )}
            </article>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

              {/* Left Column: Recording Actions */}
              <div style={{ display: "grid", gap: "24px", alignContent: "start" }}>

                {/* Form 1: Sales / Treatment Logger */}
                <article className="glass-card" style={{ padding: "28px", border: "1px solid rgba(110, 231, 255, 0.15)" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 18px", color: "var(--accent)" }}>Record Service Treatment</h2>

                  {saleError && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255, 100, 100, 0.1)", border: "1px solid rgba(255, 100, 100, 0.2)", color: "#cc0000", fontSize: "0.86rem", marginBottom: "16px" }}>
                      {saleError}
                    </div>
                  )}
                  {saleSuccess && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(142, 240, 178, 0.1)", border: "1px solid rgba(142, 240, 178, 0.2)", color: "#92fb9c", fontSize: "0.86rem", marginBottom: "16px" }}>
                      Treatment recorded and revenue updated!
                    </div>
                  )}

                  <form onSubmit={handleRecordTreatment} style={{ display: "grid", gap: "14px" }}>

                    {/* Multi-Employee Selector */}
                    <div style={{ display: "grid", gap: "6px" }} ref={empDropdownRef}>
                      <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Assigned Therapists * <span style={{ fontSize: "0.76rem", opacity: 0.6 }}>(select multiple for combo packs)</span></span>

                      {/* Selected chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "32px" }}>
                        {selectedEmployeeIds.map(empId => {
                          const emp = employees.find(e => e.id === empId);
                          return (
                            <span key={empId} style={{
                              display: "inline-flex", alignItems: "center", gap: "6px",
                              padding: "5px 12px", borderRadius: "20px", fontSize: "0.84rem",
                              background: "rgba(110, 231, 255, 0.12)", color: "var(--accent)",
                              border: "1px solid rgba(110, 231, 255, 0.25)",
                            }}>
                              {emp?.full_name || empId}
                              <button
                                type="button"
                                onClick={() => removeEmployee(empId)}
                                style={{
                                  background: "none", border: "none", color: "var(--accent)",
                                  cursor: "pointer", padding: "0", fontSize: "1rem", lineHeight: 1,
                                }}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>

                      {/* Dropdown trigger */}
                      <button
                        type="button"
                        onClick={() => setShowEmpDropdown(!showEmpDropdown)}
                        style={{
                          ...selectInputStyle,
                          cursor: "pointer", textAlign: "left",
                          color: selectedEmployeeIds.length > 0 ? "var(--muted)" : "var(--muted-light)",
                        }}
                      >
                        {selectedEmployeeIds.length > 0
                          ? `${selectedEmployeeIds.length} therapist(s) selected — click to add more`
                          : "Click to select therapists..."}
                      </button>

                      {/* Dropdown list */}
                      {showEmpDropdown && (
                        <div style={{
                          borderRadius: "14px", border: "1px solid var(--line)",
                          background: "var(--surface-2)", maxHeight: "200px", overflowY: "auto",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                        }}>
                          {employees.length === 0 ? (
                            <div style={{ padding: "12px 16px", color: "var(--muted)", fontSize: "0.86rem" }}>No therapists available</div>
                          ) : (
                            employees.map(emp => {
                              const isSelected = selectedEmployeeIds.includes(emp.id);
                              return (
                                <div
                                  key={emp.id}
                                  onClick={() => toggleEmployee(emp.id)}
                                  style={{
                                    padding: "10px 16px", cursor: "pointer",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    background: isSelected ? "rgba(110, 231, 255, 0.08)" : "transparent",
                                    borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
                                    transition: "background 0.15s ease",
                                  }}
                                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(0, 0, 0, 0.04)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? "rgba(110, 231, 255, 0.08)" : "transparent"; }}
                                >
                                  <span style={{ color: "var(--text)", fontSize: "0.9rem" }}>
                                    {emp.full_name} <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>({emp.role})</span>
                                  </span>
                                  {isSelected && <span style={{ color: "var(--accent)", fontSize: "1.1rem" }}>✓</span>}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Service Treatment */}
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Service Treatment *</span>
                      <select
                        value={saleServiceId}
                        onChange={handleServiceChange}
                        style={selectInputStyle}
                      >
                        {services.map((s: Service) => (
                          <option key={s.id} value={s.id}>{s.name} (৳{s.price})</option>
                        ))}
                      </select>
                    </label>

                    {/* Customer Search */}
                    <div style={{ display: "grid", gap: "6px", position: "relative" }} ref={custDropdownRef}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                          Customer
                          {selectedCustomer && (
                            <span style={{ marginLeft: "8px", fontSize: "0.76rem", color: "var(--accent-3)" }}>
                              ✓ {selectedCustomer.full_name} ({selectedCustomer.phone})
                            </span>
                          )}
                        </span>
                        {!selectedCustomer && !showNewCustomer && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCustomer(true);
                              setNewCustName(customerSearch);
                            }}
                            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}
                          >
                            ＋ New Client
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleCustomerSearch(e.target.value)}
                        onFocus={() => { if (customerResults.length > 0) setShowCustomerDropdown(true); }}
                        placeholder="Search by name or phone..."
                        style={inputStyle}
                      />

                      {/* Customer search results dropdown */}
                      {showCustomerDropdown && customerResults.length > 0 && (
                        <div style={{
                          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                          borderRadius: "14px", border: "1px solid var(--line)",
                          background: "var(--surface-2)", maxHeight: "180px", overflowY: "auto",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.4)", marginTop: "4px",
                        }}>
                          {customerResults.map(c => (
                            <div
                              key={c.id}
                              onClick={() => selectCustomer(c)}
                              style={{
                                padding: "10px 16px", cursor: "pointer",
                                borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
                                transition: "background 0.15s ease",
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0, 0, 0, 0.04)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                            >
                              <span style={{ color: "var(--text)", fontSize: "0.9rem" }}>{c.full_name}</span>
                              <span style={{ color: "var(--muted)", fontSize: "0.8rem", marginLeft: "8px" }}>{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No results — create new */}
                      {showCustomerDropdown && customerResults.length === 0 && customerSearch.trim().length >= 2 && !selectedCustomer && (
                        <div style={{
                          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                          borderRadius: "14px", border: "1px solid var(--line)",
                          background: "var(--surface-2)", padding: "12px 16px", marginTop: "4px",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                        }}>
                          <p style={{ color: "var(--muted)", fontSize: "0.86rem", margin: "0 0 8px" }}>No matching customers found.</p>
                          <button type="button" onClick={() => { setShowNewCustomer(true); setShowCustomerDropdown(false); setNewCustName(customerSearch); }}
                            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.88rem", padding: 0 }}>
                            ＋ Create new customer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* New Customer Inline Form */}
                    {showNewCustomer && !selectedCustomer && (
                      <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(142,240,178,0.04)", border: "1px solid rgba(142,240,178,0.15)", display: "grid", gap: "10px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--accent-3)", fontWeight: 600 }}>Create New Customer</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input placeholder="Full Name *" value={newCustName} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCustName(e.target.value)} style={inputStyle} />
                          <input placeholder="Phone *" value={newCustPhone} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCustPhone(e.target.value)} style={inputStyle} />
                        </div>
                        <input placeholder="Email (optional)" value={newCustEmail} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCustEmail(e.target.value)} style={inputStyle} />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => setShowNewCustomer(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.85rem" }}>Cancel</button>
                          <button type="button" onClick={handleCreateCustomer} disabled={custCreating || !newCustName || !newCustPhone}
                            className="button button--primary" style={{ padding: "6px 14px", fontSize: "0.84rem" }}>
                            {custCreating ? "Creating..." : "Save Customer"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Payment & Discount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Payment Method *</span>
                        <select
                          value={paymentMethod}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value)}
                          style={selectInputStyle}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank</option>
                          <option value="bKash">bKash</option>
                        </select>
                      </label>
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Discount applied (৳)</span>
                        <input
                          type="number"
                          value={discountAmount}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscountAmount(e.target.value)}
                          style={inputStyle}
                        />
                      </label>
                    </div>

                    {/* Final Price Display */}
                    <div style={{ padding: "12px", background: "rgba(0, 0, 0,0.02)", border: "1px solid var(--line)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Final Sale Amount:</span>
                      <strong style={{ fontSize: "1.1rem", color: "var(--accent-3)" }}>
                        ৳{((services.find(s => s.id === saleServiceId)?.price || 0) - (parseFloat(discountAmount) || 0)).toLocaleString()}
                      </strong>
                    </div>

                    <button
                      type="submit"
                      disabled={saleSubmitting}
                      className="button button--primary"
                      style={{ width: "100%", marginTop: "8px", padding: "0.8rem" }}
                    >
                      {saleSubmitting ? "Saving..." : "Record Treatment"}
                    </button>
                  </form>
                </article>

                {/* Form 2: Expense Logger */}
                <article className="glass-card" style={{ padding: "28px", border: "1px solid rgba(0, 0, 0, 0.05)" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 18px", color: "var(--accent-2)" }}>Log Branch Expense</h2>

                  {costError && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255, 100, 100, 0.1)", border: "1px solid rgba(255, 100, 100, 0.2)", color: "#cc0000", fontSize: "0.86rem", marginBottom: "16px" }}>
                      {costError}
                    </div>
                  )}
                  {costSuccess && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(142, 240, 178, 0.1)", border: "1px solid rgba(142, 240, 178, 0.2)", color: "#92fb9c", fontSize: "0.86rem", marginBottom: "16px" }}>
                      Branch expense logged successfully!
                    </div>
                  )}

                  <form onSubmit={handleLogExpense} style={{ display: "grid", gap: "14px" }}>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Expense Category *</span>
                        <select
                          value={costType}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setCostType(e.target.value)}
                          style={selectInputStyle}
                        >
                          <option value="Medical Supplies">Medical Supplies</option>
                          <option value="Rent & Utilities">Rent & Utilities</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                      </label>
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Amount (৳) *</span>
                        <input
                          type="number" required
                          value={costAmount}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setCostAmount(e.target.value)}
                          placeholder="e.g. 15000"
                          style={inputStyle}
                        />
                      </label>
                    </div>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Note / Description</span>
                      <textarea
                        value={costNote}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCostNote(e.target.value)}
                        placeholder="Provide details about supplier or invoice..."
                        rows={2}
                        style={{ ...inputStyle, resize: "none", font: "inherit" }}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={costSubmitting}
                      className="button button--secondary"
                      style={{ width: "100%", marginTop: "8px", padding: "0.8rem" }}
                    >
                      {costSubmitting ? "Logging..." : "Log Expense"}
                    </button>
                  </form>
                </article>

                {/* Form 3: Attendance Logger */}
                <article className="glass-card" style={{ padding: "28px", border: "1px solid rgba(0, 0, 0, 0.05)" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 18px", color: "var(--accent-2)" }}>Log Attendance</h2>

                  {attError && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255, 100, 100, 0.1)", border: "1px solid rgba(255, 100, 100, 0.2)", color: "#cc0000", fontSize: "0.86rem", marginBottom: "16px" }}>
                      {attError}
                    </div>
                  )}
                  {attSuccess && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(142, 240, 178, 0.1)", border: "1px solid rgba(142, 240, 178, 0.2)", color: "#92fb9c", fontSize: "0.86rem", marginBottom: "16px" }}>
                      Attendance logged successfully!
                    </div>
                  )}

                  <form onSubmit={handleLogAttendance} style={{ display: "grid", gap: "14px" }}>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Employee *</span>
                        <select
                          value={attEmployeeId}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setAttEmployeeId(e.target.value)}
                          style={selectInputStyle}
                          required
                        >
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Status *</span>
                        <select
                          value={attStatus}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setAttStatus(e.target.value)}
                          style={selectInputStyle}
                        >
                          <option value="Late">Late (3 = 1 Day Sal Deduction)</option>
                          <option value="Leave">Leave (Manual Deduction)</option>
                        </select>
                      </label>
                    </div>
                    {attStatus === "Leave" && (
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Leave Deduction Amount (৳)</span>
                        <input
                          type="number"
                          value={attDeduction}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setAttDeduction(e.target.value)}
                          placeholder="e.g. 500"
                          style={inputStyle}
                        />
                      </label>
                    )}
                    <button
                      type="submit"
                      disabled={attSubmitting}
                      className="button button--secondary"
                      style={{ width: "100%", marginTop: "8px", padding: "0.8rem" }}
                    >
                      {attSubmitting ? "Logging..." : "Log Attendance"}
                    </button>
                  </form>
                </article>
              </div>

              {/* Right Column: Live Activity Feed */}
              <div style={{ display: "grid", alignContent: "start", gap: "20px" }}>
                <article className="glass-card" style={{ padding: "28px", minHeight: "650px", display: "flex", flexDirection: "column" }}>

                  {/* Log Header + Date Picker */}
                  <div style={{ marginBottom: "16px" }}>
                    <div className="mobile-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: 0 }}>Branch Operations Log</h2>
                      <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 10px", borderRadius: "8px", background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--accent)" }}>
                        Daily View
                      </span>
                    </div>

                    {/* Target Progress Bar */}
                    {branchTarget && (
                      <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(110, 231, 255, 0.05)", border: "1px solid rgba(110, 231, 255, 0.2)", marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Monthly Target ({branchTarget.month})</span>
                          <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                            ৳{sales.reduce((sum, s) => sum + s.sale_amount, 0).toLocaleString()} / ৳{branchTarget.target_amount.toLocaleString()}
                          </strong>
                        </div>
                        <div style={{ height: "6px", background: "var(--surface-2)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            background: "var(--accent)",
                            width: `${Math.min(100, (sales.reduce((sum, s) => sum + s.sale_amount, 0) / branchTarget.target_amount) * 100)}%`,
                            transition: "width 0.5s ease"
                          }} />
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--accent-2)", marginTop: "8px", textAlign: "right" }}>
                          {sales.reduce((sum, s) => sum + s.sale_amount, 0) >= branchTarget.target_amount 
                            ? "Target Reached! Commission Unlocked 🎉" 
                            : `৳${(branchTarget.target_amount - sales.reduce((sum, s) => sum + s.sale_amount, 0)).toLocaleString()} to unlock commission.`}
                        </div>
                      </div>
                    )}

                    {/* Modern Calendar Picker */}
                    <CalendarPicker
                      value={logDate}
                      onChange={setLogDate}
                      activeDates={activeDates}
                    />

                    {/* Daily Summary Bar */}
                    {(() => {
                      const dayItems = [
                        ...sales.map(s => ({ ...s, feedType: "sale" as const })),
                        ...costs.map(c => ({ ...c, feedType: "cost" as const }))
                      ].filter(item => new Date(item.created_at).toLocaleDateString("en-CA") === logDate);
                      const dayRevenue = dayItems.filter(i => i.feedType === "sale").reduce((sum, i) => sum + (i as Sale).sale_amount, 0);
                      const dayExpenses = dayItems.filter(i => i.feedType === "cost").reduce((sum, i) => sum + (i as CostEntry).amount, 0);
                      const dayNet = dayRevenue - dayExpenses;
                      if (dayItems.length === 0) return null;
                      return (
                        <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                          <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--accent)", display: "block" }}>Revenue</span>
                            <strong style={{ color: "var(--accent-3)", fontSize: "0.95rem" }}>+৳{dayRevenue.toLocaleString()}</strong>
                          </div>
                          <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(255,100,100,0.06)", border: "1px solid rgba(255,100,100,0.15)" }}>
                            <span style={{ fontSize: "0.72rem", color: "#ff7c7c", display: "block" }}>Expenses</span>
                            <strong style={{ color: "#ff7c7c", fontSize: "0.95rem" }}>-৳{dayExpenses.toLocaleString()}</strong>
                          </div>
                          <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.04)", border: "1px solid var(--line)" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--muted)", display: "block" }}>Net</span>
                            <strong style={{ color: dayNet >= 0 ? "var(--accent-3)" : "#ff7c7c", fontSize: "0.95rem" }}>৳{dayNet.toLocaleString()}</strong>
                          </div>
                          <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.04)", border: "1px solid var(--line)" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--muted)", display: "block" }}>Entries</span>
                            <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{dayItems.length}</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Log Entries */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(() => {
                      const dayItems = [
                        ...sales.map(s => ({ ...s, feedType: "sale" as const })),
                        ...costs.map(c => ({ ...c, feedType: "cost" as const }))
                      ]
                        .filter(item => new Date(item.created_at).toLocaleDateString("en-CA") === logDate)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                      if (dayItems.length === 0) {
                        return (
                          <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "40px", fontSize: "0.95rem" }}>
                            No entries for {new Date(logDate + "T12:00:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}.
                          </p>
                        );
                      }

                      return dayItems.map((item) => {
                        const isSale = item.feedType === "sale";
                        const timeStr = new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        return (
                          <div
                            key={item.id}
                            style={{
                              padding: "16px", borderRadius: "16px",
                              background: isSale ? "rgba(201,168,76,0.03)" : "rgba(255,100,100,0.02)",
                              border: `1px solid ${isSale ? "rgba(201,168,76,0.12)" : "rgba(255,100,100,0.08)"}`,
                              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px"
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.05em", color: isSale ? "var(--accent)" : "#ff7c7c" }}>
                                {isSale ? "Treatment Completed" : "Branch Expense"}
                              </span>
                              <strong style={{ fontSize: "1rem", color: "var(--text)" }}>
                                {isSale ? getServiceName((item as Sale).service_id) : (item as CostEntry).cost_type}
                              </strong>
                              <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                                {isSale
                                  ? `By: ${getTherapistNames(item as Sale)}`
                                  : (item as CostEntry).note || "No note specified"
                                }
                              </span>
                              <span style={{ fontSize: "0.72rem", color: "var(--muted-light)", marginTop: "4px" }}>
                                {timeStr}
                              </span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <strong style={{ fontSize: "1.2rem", color: isSale ? "var(--accent-3)" : "#ff7c7c" }}>
                                {isSale ? `+৳${(item as Sale).sale_amount.toLocaleString()}` : `-৳${(item as CostEntry).amount.toLocaleString()}`}
                              </strong>
                              {isSale && (item as Sale).discount_amount > 0 && (
                                <div style={{ fontSize: "0.78rem", color: "rgba(0, 0, 0,0.4)" }}>
                                  ৳{(item as Sale).discount_amount.toLocaleString()} disc
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </article>
              </div>

            </div>
          </>
        )}

        {activeTab === "crm" && (
          <CrmPortal services={services} />
        )}

        {activeTab === "appointments" && (
          <AppointmentsView branchId={profile?.branch_id} />
        )}
      </section>
    </main>
  );
}