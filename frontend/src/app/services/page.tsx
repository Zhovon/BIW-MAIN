"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { getSupabaseBrowserClient, getRoleFromUserMetadata } from "@/lib/supabase/client";
import type { AuthRole } from "@/lib/supabase/roles";

type Service = {
  id: string;
  branch_id: string | null;
  name: string;
  price: number;
  cost: number;
};

type Branch = {
  id: string;
  name: string;
  city: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AuthRole | null>(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addCost, setAddCost] = useState("");
  const [addBranchId, setAddBranchId] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserRole(getRoleFromUserMetadata(user.user_metadata, user.app_metadata));
        }
        const base = getApiBaseUrl();
        const [servRes, branchRes] = await Promise.all([
          fetch(`${base}/api/v1/services`),
          fetch(`${base}/api/v1/branches`),
        ]);
        if (servRes.ok) setServices(await servRes.json());
        if (branchRes.ok) {
          const bd = await branchRes.json();
          setBranches(bd);
          if (bd.length > 0) setAddBranchId(bd[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const canEdit = userRole === "owner" || userRole === "manager";

  const getBranchName = (id: string | null) => {
    if (!id) return "All Branches";
    const b = branches.find(x => x.id === id);
    return b ? b.name : id;
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    setAddError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: addBranchId || null,
          name: addName,
          price: parseFloat(addPrice) || 0,
          cost: parseFloat(addCost) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create service.");
      }
      const newService = await res.json();
      setServices(prev => [newService, ...prev]);
      setAddName(""); setAddPrice(""); setAddCost("");
      setShowAdd(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddSubmitting(false);
    }
  };

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditPrice(s.price.toString());
    setEditCost(s.cost.toString());
    setEditBranchId(s.branch_id || "");
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/services/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          price: parseFloat(editPrice) || 0,
          cost: parseFloat(editCost) || 0,
          branch_id: editBranchId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service.");
      const updated = await res.json();
      setServices(prev => prev.map(s => s.id === editId ? updated : s));
      setEditId(null);
    } catch {
      alert("Failed to update service.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete service.");
      setServices(prev => prev.filter(s => s.id !== id));
    } catch {
      alert("Failed to delete service.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "8px", border: "1px solid var(--border)",
    background: "var(--surface-2)", padding: "0.75rem 0.95rem",
    color: "var(--text)", outline: "none", font: "inherit",
  };
  const selectStyle: React.CSSProperties = {
    ...inputStyle, background: "var(--surface-2)",
  };
  const labelStyle: React.CSSProperties = { display: "grid", gap: "6px" };
  const spanStyle: React.CSSProperties = { fontSize: "0.84rem", color: "var(--muted)" };

  if (loading) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <div>
            <p className="section-label">Services</p>
            <h1>Loading service catalog...</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="content-grid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p className="section-label">Services</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
              Service catalog and pricing structure.
            </h1>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="button button--primary"
              style={{ padding: "0.85rem 1.6rem", fontSize: "0.95rem" }}
            >
              {showAdd ? "Close" : "＋ Add Service"}
            </button>
          )}
        </div>

        {/* Add Service Form */}
        {showAdd && canEdit && (
          <article className="glass-card" style={{ padding: "28px", border: "1px solid var(--accent)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 18px", color: "var(--accent)" }}>New Service</h2>
            {addError && (
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff7373", fontSize: "0.86rem", marginBottom: "16px" }}>
                {addError}
              </div>
            )}
            <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <label style={labelStyle}>
                <span style={spanStyle}>Service Name *</span>
                <input required value={addName} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddName(e.target.value)} placeholder="e.g. Hydra Facial" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={spanStyle}>Branch</span>
                <select value={addBranchId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setAddBranchId(e.target.value)} style={selectStyle}>
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label style={labelStyle}>
                <span style={spanStyle}>Price (৳) *</span>
                <input type="number" required value={addPrice} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddPrice(e.target.value)} placeholder="e.g. 6500" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={spanStyle}>Cost (৳)</span>
                <input type="number" value={addCost} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddCost(e.target.value)} placeholder="e.g. 2500" style={inputStyle} />
              </label>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setShowAdd(false)} className="button button--secondary" style={{ padding: "0.75rem 1.4rem" }}>Cancel</button>
                <button type="submit" disabled={addSubmitting} className="button button--primary" style={{ padding: "0.75rem 1.6rem" }}>
                  {addSubmitting ? "Creating..." : "Create Service"}
                </button>
              </div>
            </form>
          </article>
        )}

        {/* Service Cards */}
        <div className="branch-grid">
          {services.map((service) => (
            <article key={service.id} className="glass-card branch-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {editId === service.id ? (
                <form onSubmit={handleEdit} style={{ display: "grid", gap: "12px" }}>
                  <label style={labelStyle}>
                    <span style={spanStyle}>Name</span>
                    <input value={editName} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)} required style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    <span style={spanStyle}>Branch</span>
                    <select value={editBranchId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditBranchId(e.target.value)} style={selectStyle}>
                      <option value="">All Branches</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={labelStyle}>
                      <span style={spanStyle}>Price (৳)</span>
                      <input type="number" value={editPrice} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditPrice(e.target.value)} style={inputStyle} />
                    </label>
                    <label style={labelStyle}>
                      <span style={spanStyle}>Cost (৳)</span>
                      <input type="number" value={editCost} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditCost(e.target.value)} style={inputStyle} />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => setEditId(null)} className="button button--secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>Cancel</button>
                    <button type="submit" disabled={editSubmitting} className="button button--primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                      {editSubmitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                      <h3>{service.name}</h3>
                      <span style={{
                        fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em",
                        padding: "3px 8px", borderRadius: "8px",
                        background: "rgba(110,231,255,0.08)", color: "var(--accent)",
                        border: "1px solid rgba(110,231,255,0.15)",
                      }}>
                        {getBranchName(service.branch_id)}
                      </span>
                    </div>
                    <dl>
                      <div><dt>Price</dt><dd>৳{service.price.toLocaleString()}</dd></div>
                      <div><dt>Cost</dt><dd>৳{service.cost.toLocaleString()}</dd></div>
                      <div><dt>Margin</dt><dd style={{ color: "var(--accent-3)" }}>৳{(service.price - service.cost).toLocaleString()}</dd></div>
                    </dl>
                  </div>
                  {canEdit && (
                    <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button onClick={() => handleDelete(service.id)} className="button" style={{
                        padding: "6px 14px", fontSize: "0.85rem",
                        color: "#ff6c6c", borderColor: "rgba(255,108,108,0.2)",
                        background: "rgba(255,108,108,0.04)",
                      }}>
                        Delete
                      </button>
                      <button onClick={() => startEdit(service)} className="button" style={{
                        padding: "6px 14px", fontSize: "0.85rem",
                        color: "var(--accent)", borderColor: "rgba(110,231,255,0.2)",
                        background: "rgba(110,231,255,0.04)",
                      }}>
                        Edit
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
