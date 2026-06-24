"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { getSupabaseBrowserClient, getRoleFromUserMetadata } from "@/lib/supabase/client";
import type { AuthRole } from "@/lib/supabase/roles";

type Employee = {
  id: string;
  branch_id: string | null;
  full_name: string;
  role: string;
  salary: number;
  bonus_rate: number;
  commission_rate: number;
  treatment_commission_amount?: number;
  shift_start_time?: string;
  shift_end_time?: string;
  off_days?: string;
  email?: string | null;
  user_id?: string | null;
};

type Branch = {
  id: string;
  name: string;
  city: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<AuthRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicalRole, setClinicalRole] = useState("Senior Therapist");
  const [customClinicalRole, setCustomClinicalRole] = useState("");
  const [dashboardRole, setDashboardRole] = useState<AuthRole>("employee");
  const [branchId, setBranchId] = useState("");
  const [salary, setSalary] = useState("32000");
  const [bonusRate, setBonusRate] = useState("8");
  const [commissionRate, setCommissionRate] = useState("4");
  const [treatmentCommissionAmount, setTreatmentCommissionAmount] = useState("0");
  const [shiftStartTime, setShiftStartTime] = useState("10:00");
  const [shiftEndTime, setShiftEndTime] = useState("19:00");
  const [offDays, setOffDays] = useState("Sunday");
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // 1. Fetch current user role
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserRole(getRoleFromUserMetadata(user.user_metadata, user.app_metadata));
        }

        // 2. Fetch employees and branches
        const base = getApiBaseUrl();
        const [empRes, branchRes] = await Promise.all([
          authFetch(`${base}/api/v1/employees`),
          authFetch(`${base}/api/v1/branches`),
        ]);

        if (!empRes.ok || !branchRes.ok) {
          throw new Error("Failed to load operations data from the server.");
        }

        const empsData = await empRes.json();
        const branchesData = await branchRes.json();

        setEmployees(empsData);
        setBranches(branchesData);
        if (branchesData.length > 0) {
          setBranchId(branchesData[0].id);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg || "An error occurred while loading data.");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const actualRole = clinicalRole === "custom" ? customClinicalRole : clinicalRole;
    if (!fullName || !actualRole) {
      setSubmitError("Please fill out the employee's name and role.");
      setSubmitting(false);
      return;
    }

    // If email is provided, password must be provided
    if (email && !password) {
      setSubmitError("Please set a password for the employee login account.");
      setSubmitting(false);
      return;
    }

    const payload = {
      branch_id: branchId || null,
      full_name: fullName,
      role: actualRole,
      salary: parseFloat(salary) || 0,
      bonus_rate: parseFloat(bonusRate) || 0,
      commission_rate: parseFloat(commissionRate) || 0,
      treatment_commission_amount: parseFloat(treatmentCommissionAmount) || 0,
      shift_start_time: shiftStartTime,
      shift_end_time: shiftEndTime,
      off_days: offDays,
      email: email || null,
      password: password || null,
    };

    try {
      const base = getApiBaseUrl();
      const res = await authFetch(`${base}/api/v1/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create employee.");
      }

      const newEmp = await res.json();
      setEmployees((prev: Employee[]) => [newEmp, ...prev]);

      // Reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setCustomClinicalRole("");
      setTreatmentCommissionAmount("0");
      setShiftStartTime("10:00");
      setShiftEndTime("19:00");
      setOffDays("Sunday");
      setShowAddForm(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setSubmitError(errMsg || "Failed to add employee.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee? This will delete both their database record and Supabase login account.")) {
      return;
    }

    try {
      const base = getApiBaseUrl();
      const res = await authFetch(`${base}/api/v1/employees/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete employee.");
      }

      setEmployees((prev: Employee[]) => prev.filter((emp: Employee) => emp.id !== id));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(errMsg || "Failed to delete employee.");
    }
  };

  const getBranchName = (id: string | null) => {
    if (!id) return "Unassigned Branch";
    const b = branches.find((branch: Branch) => branch.id === id);
    return b ? b.name : id;
  };

  const isOwner = currentUserRole === "owner";

  if (loading) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <div>
            <p className="section-label">Employees</p>
            <h1>Retrieving operations directory...</h1>
          </div>
        </section>
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="page-shell">
        <section className="content-grid" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-card auth-card" style={{ border: "1px solid rgba(255, 100, 100, 0.2)", maxWidth: "500px", width: "100%", padding: "40px", textAlign: "center" }}>
            <p className="section-label" style={{ color: "#ff6464" }}>Access Denied</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "14px 0", color: "var(--text)" }}>Owner Access Required</h1>
            <p className="dashboard-lead" style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "0 0 24px" }}>
              Only clinic owners are authorized to access the employee management portal.
            </p>
            <Link href="/" className="button button--primary" style={{ display: "inline-block" }}>
              Return Home
            </Link>
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
            <p className="section-label" style={{ color: "#ff6464" }}>Error Loading Data</p>
            <h1>Could not load employees.</h1>
            <p className="dashboard-lead">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="content-grid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p className="section-label">Employee & Access Hub</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
              Each employee is tied to a role, branch, and service bonus structure.
            </h1>
            <p className="dashboard-lead" style={{ marginTop: "12px" }}>
              Configure clinical details, salaries, bonus rates, and register matching authentication profiles.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="button button--primary"
              style={{ padding: "0.85rem 1.6rem", fontSize: "0.95rem" }}
            >
              {showAddForm ? "Close Form" : "Add New Employee"}
            </button>
          )}
        </div>

        {/* Info Box if not Owner */}
        {!isOwner && (
          <div className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid rgba(110, 231, 255, 0.15)" }}>
            <span style={{ fontSize: "1.2rem", color: "var(--accent)" }}>ℹ</span>
            <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--muted)" }}>
              Read-only mode: Only registered Owners can manage employee credentials and records.
            </p>
          </div>
        )}

        {/* Add Employee Form */}
        {showAddForm && isOwner && (
          <div className="glass-card" style={{ padding: "32px", marginTop: "20px", border: "1px solid var(--accent)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", margin: "0 0 24px" }}>Register Employee & Login Account</h2>
            
            {submitError && (
              <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(255, 100, 100, 0.1)", border: "1px solid rgba(255, 100, 100, 0.3)", color: "#cc0000", fontSize: "0.9rem", marginBottom: "20px" }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleAddEmployee} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
              
              {/* Left Column: Basic Info */}
              <div style={{ display: "grid", gap: "16px" }}>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Full Name *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    placeholder="e.g. Tasnim Jahan"
                    style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Branch *</span>
                  <select
                    value={branchId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
                    style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                  >
                    {branches.map((b: Branch) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Clinical Role *</span>
                    <select
                      value={clinicalRole}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setClinicalRole(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    >
                      <option value="Senior Therapist">Senior Therapist</option>
                      <option value="Front Desk Manager">Front Desk Manager</option>
                      <option value="Branch Coordinator">Branch Coordinator</option>
                      <option value="custom">Custom Role...</option>
                    </select>
                  </label>

                  {clinicalRole === "custom" && (
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Specify Custom Role *</span>
                      <input
                        type="text"
                        required
                        value={customClinicalRole}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomClinicalRole(e.target.value)}
                        placeholder="e.g. Skin specialist"
                        style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                      />
                    </label>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Salary (৳) *</span>
                    <input
                      type="number"
                      required
                      value={salary}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSalary(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Bonus Rate (%)</span>
                    <input
                      type="number"
                      value={bonusRate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setBonusRate(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Commission (%)</span>
                    <input
                      type="number"
                      value={commissionRate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCommissionRate(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Fixed Comm. / Treatment (৳)</span>
                    <input
                      type="number"
                      value={treatmentCommissionAmount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTreatmentCommissionAmount(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>
                </div>

                {/* Schedule details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "8px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Shift Start</span>
                    <input
                      type="time"
                      value={shiftStartTime}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setShiftStartTime(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Shift End</span>
                    <input
                      type="time"
                      value={shiftEndTime}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setShiftEndTime(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Weekend / Off Day</span>
                    <select
                      value={offDays}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setOffDays(e.target.value)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    >
                      <option value="Sunday">Sunday</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Right Column: Supabase Credentials */}
              <div style={{ display: "grid", gap: "16px", alignContent: "start" }}>
                <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(0, 0, 0, 0.02)", border: "1px solid rgba(0, 0, 0, 0.04)" }}>
                  <h3 style={{ fontSize: "0.95rem", margin: "0 0 12px", color: "var(--accent)" }}>System Login & Dashboard Permissions</h3>
                  
                  <label style={{ display: "grid", gap: "6px", marginBottom: "14px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Login Email (optional)</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder="e.g. employee@zhovon.com"
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px", marginBottom: "14px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Login Password (optional)</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "rgba(0, 0, 0, 0.03)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Dashboard View Access</span>
                    <select
                      value={dashboardRole}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setDashboardRole(e.target.value as AuthRole)}
                      style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--line)", background: "var(--surface-2)", padding: "0.8rem 1rem", color: "var(--text)", outline: "none" }}
                    >
                      <option value="employee">Employee Dashboard (Personal earnings, services)</option>
                      <option value="manager">Manager Dashboard (Daily branch operations entry)</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="button button--secondary"
                    style={{ padding: "0.75rem 1.4rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button button--primary"
                    style={{ padding: "0.75rem 1.6rem" }}
                  >
                    {submitting ? "Registering..." : "Add Employee & Login"}
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Employees Directory */}
        <div className="branch-grid" style={{ marginTop: "24px" }}>
          {employees.map((employee: Employee) => {
            const hasLogin = !!employee.email;
            const accessLevel = employee.user_id ? (employee.role.toLowerCase().includes("manager") ? "Manager" : "Employee") : "No Dashboard Access";
            
            return (
              <article key={employee.id} className="glass-card branch-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "300px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "10px", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.4rem", fontFamily: "var(--font-display)" }}>{employee.full_name}</h3>
                    <span style={{
                      fontSize: "0.74rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      background: employee.user_id ? "rgba(110, 231, 255, 0.12)" : "rgba(0, 0, 0, 0.05)",
                      color: employee.user_id ? "var(--accent)" : "var(--muted)",
                      border: employee.user_id ? "1px solid rgba(110, 231, 255, 0.2)" : "1px solid var(--line)"
                    }}>
                      {accessLevel}
                    </span>
                  </div>

                  <dl style={{ gap: "12px" }}>
                    <div>
                      <dt>Clinical Role</dt>
                      <dd style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text)" }}>{employee.role}</dd>
                    </div>
                    <div>
                      <dt>Branch Location</dt>
                      <dd style={{ fontSize: "0.95rem" }}>{getBranchName(employee.branch_id)}</dd>
                    </div>
                    <div>
                      <dt>Salary & Structure</dt>
                      <dd style={{ fontSize: "0.95rem" }}>
                        ৳{employee.salary.toLocaleString()} / mo • {employee.bonus_rate}% bonus • {employee.commission_rate}% comm
                        {employee.treatment_commission_amount ? ` • ৳${employee.treatment_commission_amount} / treatment` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>Schedule</dt>
                      <dd style={{ fontSize: "0.95rem" }}>
                        {employee.shift_start_time || "10:00"} - {employee.shift_end_time || "19:00"} • Off: {employee.off_days || "Sunday"}
                      </dd>
                    </div>
                    {hasLogin && (
                      <div>
                        <dt>Login Account</dt>
                        <dd style={{ fontSize: "0.9rem", color: "var(--accent-3)", fontFamily: "monospace" }}>{employee.email}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {isOwner && (
                  <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="button"
                      style={{
                        padding: "6px 14px",
                        fontSize: "0.85rem",
                        color: "#cc0000",
                        borderColor: "rgba(255, 108, 108, 0.2)",
                        background: "rgba(255, 108, 108, 0.04)"
                      }}
                    >
                      Delete Profile
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

      </section>
    </main>
  );
}
