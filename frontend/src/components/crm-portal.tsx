"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Customer, Sale, Service } from "@/types";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid var(--line)",
  background: "var(--surface-2)",
  color: "var(--text)",
  fontSize: "0.95rem",
  outline: "none",
  transition: "all 0.2s ease",
};

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const swrFetcher = async (url: string) => {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  
  if (!res.ok) {
    console.error("SWR Fetch Error:", res.status, res.statusText);
    throw new Error("API Fetch Error");
  }
  return res.json();
};

export function CrmPortal({ services }: { services: Service[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const endpoint = debouncedQuery
    ? `${getApiBaseUrl()}/api/v1/customers/search?q=${encodeURIComponent(debouncedQuery)}`
    : `${getApiBaseUrl()}/api/v1/customers`;

  const { data: customers, mutate, isValidating } = useSWR<Customer[]>(endpoint, swrFetcher, {
    keepPreviousData: true,
  });

  const { data: customerSales } = useSWR<Sale[]>(
    selectedCustomer ? `${getApiBaseUrl()}/api/v1/sales/customer/${selectedCustomer.id}` : null,
    swrFetcher
  );

  const handleCreateCustomer = async () => {
    setIsCreating(true);
    try {
      const res = await authFetch(`${getApiBaseUrl()}/api/v1/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: newName,
          phone: newPhone,
          email: newEmail,
          notes: newNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to create customer");

      const newCust = await res.json();
      mutate();
      setShowAddForm(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewNotes("");
      setSelectedCustomer(newCust);
      toast({
        title: "Client Registered",
        description: `${newCust.full_name} has been added to the directory.`,
        type: "success",
      });
    } catch {
      toast({
        title: "Registration Failed",
        description: "An error occurred while saving the client.",
        type: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getServiceName = (id: string | null) => {
    if (!id) return "Unknown Service";
    const svc = services.find((s) => s.id === id);
    return svc ? svc.name : "Unknown Service";
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* CRM Search & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search customer directory by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyle}
          />
          {isValidating && (
            <span style={{ position: "absolute", right: "16px", top: "12px", color: "var(--muted)", fontSize: "0.8rem" }}>
              Searching...
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="button button--primary"
          style={{ padding: "0.75rem 1.5rem" }}
        >
          {showAddForm ? "Close Form" : "＋ Register Customer"}
        </button>
      </div>

      {/* Inline Customer Add Form */}
      {showAddForm && (
        <article className="glass-card" style={{ padding: "28px", border: "1px solid rgba(142, 240, 178, 0.2)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", margin: "0 0 16px", color: "var(--accent-3)" }}>
            Register New Client Record
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Full Name *</span>
              <input
                type="text" required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Asif Mahmud"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Phone Number *</span>
              <input
                type="text" required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
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
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. client@domain.com"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Consultation / Profile Notes</span>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Describe skin condition, treatment goals, allergies, or past treatments..."
                rows={3}
                style={{ ...inputStyle, resize: "none", font: "inherit" }}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCustomer}
              disabled={isCreating || !newName || !newPhone}
              className="button button--primary"
              style={{ padding: "0.75rem 1.6rem" }}
            >
              {isCreating ? "Saving..." : "Save Customer"}
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
            {!customers && !isValidating && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ padding: "16px", borderRadius: "16px", background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--line)" }}>
                    <Skeleton style={{ height: "20px", width: "60%", marginBottom: "8px" }} />
                    <Skeleton style={{ height: "16px", width: "40%", marginBottom: "12px" }} />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Skeleton style={{ height: "24px", width: "80px", borderRadius: "6px" }} />
                      <Skeleton style={{ height: "24px", width: "90px", borderRadius: "6px" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {customers?.map(c => {
              const isSelected = selectedCustomer?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    background: isSelected ? "rgba(110, 231, 255, 0.06)" : "rgba(0, 0, 0, 0.01)",
                    border: `1px solid ${isSelected ? "rgba(110, 231, 255, 0.25)" : "var(--line)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <strong style={{ display: "block", fontSize: "1.05rem", color: isSelected ? "var(--accent)" : "var(--text)" }}>
                    {c.uid && <span style={{ color: "var(--muted)", marginRight: "6px" }}>#{c.uid}</span>}
                    {c.full_name}
                  </strong>
                  <span style={{ fontSize: "0.82rem", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                    {c.phone} {c.email ? `• ${c.email}` : ""}
                  </span>
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                    <span style={{ fontSize: "0.72rem", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: "6px", color: "var(--muted)" }}>
                      {c.total_visits || 0} Treatments
                    </span>
                    <span style={{ fontSize: "0.72rem", background: "rgba(110, 231, 255, 0.08)", padding: "2px 8px", borderRadius: "6px", color: "var(--accent)" }}>
                      ৳{(c.total_spent || 0).toLocaleString()} Spent
                    </span>
                  </div>
                </div>
              );
            })}
            {customers?.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: "0.95rem" }}>
                No clients found in directory.
              </p>
            )}
          </div>
        </article>

        {/* Right Column: Customer Details & Treatment History */}
        <article className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", minHeight: "500px" }}>
          {selectedCustomer ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
              
              <div>
                <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderRadius: "6px", background: "rgba(110,231,255,0.06)", border: "1px solid rgba(110,231,255,0.15)", color: "var(--accent)" }}>
                  Client Profile
                </span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", margin: "10px 0 4px", color: "var(--text)" }}>
                  {selectedCustomer.uid && <span style={{ color: "var(--muted)", marginRight: "8px" }}>#{selectedCustomer.uid}</span>}
                  {selectedCustomer.full_name}
                </h3>
                <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
                  Contact: {selectedCustomer.phone} {selectedCustomer.email ? `• ${selectedCustomer.email}` : ""}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Lifetime Spent</span>
                  <strong style={{ fontSize: "1.2rem", color: "var(--accent-3)" }}>
                    ৳{(selectedCustomer.total_spent || 0).toLocaleString()}
                  </strong>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Total Visits</span>
                  <strong style={{ fontSize: "1.2rem", color: "var(--text)" }}>
                    {selectedCustomer.total_visits || 0}
                  </strong>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Avg. Treatment Ticket</span>
                  <strong style={{ fontSize: "1.2rem", color: "var(--accent)" }}>
                    ৳{selectedCustomer.total_visits > 0 ? Math.round((selectedCustomer.total_spent || 0) / selectedCustomer.total_visits).toLocaleString() : 0}
                  </strong>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: "0.88rem", color: "var(--text)", display: "block", marginBottom: "8px" }}>
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
                  {selectedCustomer.notes || "No notes registered for this client."}
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
                <strong style={{ fontSize: "0.88rem", color: "var(--text)", display: "block", marginBottom: "12px" }}>
                  Treatment & Purchase History
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1, maxHeight: "300px" }}>
                  {!customerSales ? (
                     <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                       {[...Array(3)].map((_, i) => (
                         <div key={i} style={{ padding: "14px", borderRadius: "14px", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
                           <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                             <Skeleton style={{ height: "18px", width: "50%" }} />
                             <Skeleton style={{ height: "14px", width: "30%" }} />
                           </div>
                           <Skeleton style={{ height: "20px", width: "80px" }} />
                         </div>
                       ))}
                     </div>
                  ) : customerSales.length === 0 ? (
                    <p style={{ color: "var(--muted)", padding: "30px 0", fontSize: "0.88rem", textAlign: "center" }}>
                      No treatments recorded for this client yet.
                    </p>
                  ) : (
                    customerSales.map(sale => (
                        <div
                          key={sale.id}
                          style={{
                            padding: "14px",
                            borderRadius: "14px",
                            background: "rgba(0, 0, 0, 0.01)",
                            border: "1px solid var(--line)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{getServiceName(sale.service_id)}</strong>
                            <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                              {new Date(sale.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <strong style={{ color: "var(--accent)" }}>৳{sale.sale_amount.toLocaleString()}</strong>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--muted)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <p style={{ margin: 0, fontSize: "1.05rem" }}>Select a client from the directory</p>
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", opacity: 0.7 }}>View their profile, consultation notes, and treatment history.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
