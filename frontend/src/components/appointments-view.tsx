"use client";

import React, { useEffect, useState } from "react";
import { getApiBaseUrl, authFetch } from "@/lib/api";

type Appointment = {
  id: string;
  customer_id: string;
  employee_id: string | null;
  service_id: string;
  branch_id: string;
  appointment_time: string;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
};

// We need these types to map IDs to names if they aren't pre-populated
type Service = { id: string; name: string };
type Employee = { id: string; full_name: string };
type Customer = { id: string; full_name: string; phone: string };

interface AppointmentsViewProps {
  branchId?: string | null; // If null, fetch all branches
}

export function AppointmentsView({ branchId }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple date filter
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const base = getApiBaseUrl();
        
        // Build URL
        let url = `${base}/api/v1/appointments`;
        const params = new URLSearchParams();
        if (branchId) params.append("branch_id", branchId);
        if (selectedDate) params.append("date", selectedDate);
        if (params.toString()) url += `?${params.toString()}`;

        const [apptRes, srvRes, empRes, custRes] = await Promise.all([
          authFetch(url),
          authFetch(`${base}/api/v1/services`),
          authFetch(`${base}/api/v1/employees`),
          authFetch(`${base}/api/v1/customers?limit=1000`)
        ]);

        if (apptRes.ok) setAppointments(await apptRes.json());
        if (srvRes.ok) setServices(await srvRes.json());
        if (empRes.ok) setEmployees(await empRes.json());
        if (custRes.ok) setCustomers(await custRes.json());
      } catch (err) {
        console.error("Failed to load appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [branchId, selectedDate]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/appointments/${id}/status?status=${newStatus}`, {
        method: "PATCH",
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a.id === id ? updated : a));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const getSrvName = (id: string) => services.find(s => s.id === id)?.name || id;
  const getEmpName = (id: string | null) => {
    if (!id) return "Unassigned Therapist";
    return employees.find(e => e.id === id)?.full_name || id;
  };
  const getCust = (id: string) => customers.find(c => c.id === id);

  return (
    <article className="glass-card" style={{ padding: "28px", minHeight: "500px" }}>
      <div className="mobile-stack" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: 0 }}>Appointments</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>Manage upcoming bookings</p>
        </div>
        <div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--surface-2)", color: "var(--text)", outline: "none", colorScheme: "light" }}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No appointments found.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {appointments.map(appt => {
            const c = getCust(appt.customer_id);
            const dateObj = new Date(appt.appointment_time);
            return (
              <div key={appt.id} className="mobile-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", border: "1px solid var(--line)", background: "rgba(0,0,0,0.02)", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text)" }}>{c?.full_name || "Unknown"} <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: "normal" }}>({c?.phone || "No phone"})</span></div>
                  <div style={{ color: "var(--accent)", fontSize: "0.9rem" }}>{getSrvName(appt.service_id)} with {getEmpName(appt.employee_id)}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>{dateObj.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px", background: "var(--surface-2)", border: "1px solid var(--line)" }}>{appt.payment_status}</span>
                  </div>
                  <select 
                    value={appt.status}
                    onChange={(e) => updateStatus(appt.id, e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: appt.status === "Pending" ? "var(--surface-2)" : appt.status === "Confirmed" ? "rgba(142,240,178,0.2)" : "rgba(255,100,100,0.2)", outline: "none", fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
