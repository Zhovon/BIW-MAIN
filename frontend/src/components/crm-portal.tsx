"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Customer, Sale, Service } from "@/types";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #000",
  background: "#fff",
  color: "#000",
  fontSize: "14px",
  fontFamily: "Times New Roman, serif",
  outline: "none",
};


const swrFetcher = async (url: string) => {
  const res = await authFetch(url);
  
  if (!res.ok) {
    if (res.status === 401) {
      // Throw a specific error so SWR knows not to aggressively retry authentication failures
      const error = new Error("Not authorized") as Error & { status?: number };
      error.status = 401;
      throw error;
    }
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
    shouldRetryOnError: false,
  });

  const { data: customerSales } = useSWR<Sale[]>(
    selectedCustomer ? `${getApiBaseUrl()}/api/v1/sales/customer/${selectedCustomer.id}` : null,
    swrFetcher,
    { shouldRetryOnError: false }
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
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 border border-black p-4 bg-white">
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search customer directory by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyle}
          />
          {isValidating && (
            <span style={{ position: "absolute", right: "16px", top: "12px", color: isSelected ? "#fff" : "#555", fontSize: "0.8rem" }}>
              Searching...
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ padding: "10px 16px", background: "#000", color: "#fff", border: "1px solid #000", fontFamily: "Times New Roman, serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", cursor: "pointer" }}
        >
          {showAddForm ? "Close Form" : "＋ Register Customer"}
        </button>
      </div>

      {/* Inline Customer Add Form */}
      {showAddForm && (
        <article style={{ padding: "20px", border: "1px solid #000", marginBottom: "24px", background: "#fff" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: "4px", borderBottom: "2px solid #000", marginBottom: "16px" }}>01 · Register New Client Record</h3>
            Register New Client Record
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: isSelected ? "#fff" : "#555" }}>Full Name *</span>
              <input
                type="text" required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Asif Mahmud"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: isSelected ? "#fff" : "#555" }}>Phone Number *</span>
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
              <span style={{ fontSize: "0.84rem", color: isSelected ? "#fff" : "#555" }}>Email Address</span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. client@domain.com"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.84rem", color: isSelected ? "#fff" : "#555" }}>Consultation / Profile Notes</span>
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
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: "none", border: "1px solid #000", background: "#fff", color: "#000", padding: "10px 16px", fontFamily: "Times New Roman, serif", textTransform: "uppercase", fontWeight: "bold", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCustomer}
              disabled={isCreating || !newName || !newPhone}
              style={{ padding: "10px 16px", background: "#000", color: "#fff", border: "1px solid #000", fontFamily: "Times New Roman, serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", cursor: "pointer" }}
            >
              {isCreating ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </article>
      )}

      {/* CRM Two Column Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-0 border border-black">
        
        {/* Left Column: Customer Directory List */}
        <article className="min-w-0" style={{ padding: "20px", display: "flex", flexDirection: "column", maxHeight: "650px", borderRight: "1px solid #000", background: "#fff" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: "4px", borderBottom: "2px solid #000", marginBottom: "16px" }}>02 · Client Directory</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1, paddingRight: "4px" }}>
            {!customers && !isValidating && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ padding: "16px", borderRadius: "0", background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--line)" }}>
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
                    borderRadius: "0", background: isSelected ? "#000" : "#fff", border: "1px solid #000",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <strong style={{ display: "block", fontSize: "1.05rem", color: isSelected ? "#C9A84C" : "#000", fontFamily: "Times New Roman, serif" }}>
                    {c.uid && <span style={{ color: isSelected ? "#fff" : "#555", marginRight: "6px" }}>#{c.uid}</span>}
                    {c.full_name}
                  </strong>
                  <span style={{ fontSize: "0.82rem", color: isSelected ? "#fff" : "#555", display: "block", marginTop: "2px" }}>
                    {c.phone} {c.email ? `• ${c.email}` : ""}
                  </span>
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                    <span style={{ fontSize: "0.72rem", background: isSelected ? "#333" : "#eee", border: "1px solid #000", padding: "2px 8px", borderRadius: "6px", color: isSelected ? "#fff" : "#555" }}>
                      {c.total_visits || 0} Treatments
                    </span>
                    <span style={{ fontSize: "0.72rem", background: isSelected ? "#555" : "#ddd", border: "1px solid #000", color: isSelected ? "#fff" : "#000", padding: "2px 8px", borderRadius: "6px", color: "#000" }}>
                      ৳{(c.total_spent || 0).toLocaleString()} Spent
                    </span>
                  </div>
                </div>
              );
            })}
            {customers?.length === 0 && (
              <p style={{ textAlign: "center", color: isSelected ? "#fff" : "#555", padding: "40px 0", fontSize: "0.95rem" }}>
                No clients found in directory.
              </p>
            )}
          </div>
        </article>

        {/* Right Column: Customer Details & Treatment History */}
        <article className="min-w-0" style={{ padding: "20px", display: "flex", flexDirection: "column", minHeight: "500px", background: "#fff" }}>
          {selectedCustomer ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
              
              <div>
                <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderRadius: "6px", background: "rgba(110,231,255,0.06)", border: "1px solid rgba(110,231,255,0.15)", color: "#000" }}>
                  Client Profile
                </span>
                <h3 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 4px", color: "#000", fontFamily: "Times New Roman, serif" }}>
                  {selectedCustomer.uid && <span style={{ color: isSelected ? "#fff" : "#555", marginRight: "8px" }}>#{selectedCustomer.uid}</span>}
                  {selectedCustomer.full_name}
                </h3>
                <span style={{ fontSize: "0.88rem", color: isSelected ? "#fff" : "#555" }}>
                  Contact: {selectedCustomer.phone} {selectedCustomer.email ? `• ${selectedCustomer.email}` : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-black mb-6">
                <div style={{ padding: "12px 16px", borderRadius: "0", background: isSelected ? "#333" : "#eee", border: "1px solid #000" }}>
                  <span style={{ fontSize: "0.75rem", color: isSelected ? "#fff" : "#555", display: "block" }}>Lifetime Spent</span>
                  <strong style={{ fontSize: "22px", fontWeight: "bold", color: "#000" }}>
                    ৳{(selectedCustomer.total_spent || 0).toLocaleString()}
                  </strong>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "0", background: isSelected ? "#333" : "#eee", border: "1px solid #000" }}>
                  <span style={{ fontSize: "0.75rem", color: isSelected ? "#fff" : "#555", display: "block" }}>Total Visits</span>
                  <strong style={{ fontSize: "22px", fontWeight: "bold", color: "#000" }}>
                    {selectedCustomer.total_visits || 0}
                  </strong>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "0", background: isSelected ? "#333" : "#eee", border: "1px solid #000" }}>
                  <span style={{ fontSize: "0.75rem", color: isSelected ? "#fff" : "#555", display: "block" }}>Avg. Treatment Ticket</span>
                  <strong style={{ fontSize: "22px", fontWeight: "bold", color: "#000" }}>
                    ৳{selectedCustomer.total_visits > 0 ? Math.round((selectedCustomer.total_spent || 0) / selectedCustomer.total_visits).toLocaleString() : 0}
                  </strong>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: "4px", borderBottom: "2px solid #000", marginBottom: "12px", display: "block" }}>
                  Consultation & Profile Notes
                </strong>
                <div style={{
                  padding: "16px", border: "1px solid #000", background: "#fff",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  color: isSelected ? "#fff" : "#555",
                  minHeight: "80px",
                  whiteSpace: "pre-wrap"
                }}>
                  {selectedCustomer.notes || "No notes registered for this client."}
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
                <strong style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: "4px", borderBottom: "2px solid #000", marginBottom: "12px", display: "block" }}>
                  Treatment & Purchase History
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1, maxHeight: "300px" }}>
                  {!customerSales ? (
                     <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                       {[...Array(3)].map((_, i) => (
                         <div key={i} style={{ padding: "14px", borderRadius: "0", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
                           <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                             <Skeleton style={{ height: "18px", width: "50%" }} />
                             <Skeleton style={{ height: "14px", width: "30%" }} />
                           </div>
                           <Skeleton style={{ height: "20px", width: "80px" }} />
                         </div>
                       ))}
                     </div>
                  ) : customerSales.length === 0 ? (
                    <p style={{ color: isSelected ? "#fff" : "#555", padding: "30px 0", fontSize: "0.88rem", textAlign: "center" }}>
                      No treatments recorded for this client yet.
                    </p>
                  ) : (
                    customerSales.map(sale => (
                        <div
                          key={sale.id}
                          style={{
                            padding: "14px", borderBottom: "1px solid #000", background: "#fff", borderRadius: "0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{getServiceName(sale.service_id)}</strong>
                            <span style={{ fontSize: "0.8rem", color: isSelected ? "#fff" : "#555", display: "block", marginTop: "2px" }}>
                              {new Date(sale.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <strong style={{ color: "#000" }}>৳{sale.sale_amount.toLocaleString()}</strong>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: isSelected ? "#fff" : "#555" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: isSelected ? "#333" : "#eee", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
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
