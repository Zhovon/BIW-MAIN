"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { getSupabaseBrowserClient, getRoleFromUserMetadata } from "@/lib/supabase/client";
import type { AuthRole } from "@/lib/supabase/roles";

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  opening_hours: string | null;
  is_active: boolean;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AuthRole | null>(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addHours, setAddHours] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserRole(getRoleFromUserMetadata(user.user_metadata, user.app_metadata));
        }
        const res = await fetch(`${getApiBaseUrl()}/api/v1/branches`);
        if (res.ok) setBranches(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const canEdit = userRole === "owner" || userRole === "manager";

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    setAddError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          city: addCity,
          address: addAddress || null,
          phone: addPhone || null,
          opening_hours: addHours || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create branch.");
      }
      const newBranch = await res.json();
      setBranches(prev => [newBranch, ...prev]);
      setAddName(""); setAddCity(""); setAddAddress(""); setAddPhone(""); setAddHours("");
      setShowAdd(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddSubmitting(false);
    }
  };

  const startEdit = (b: Branch) => {
    setEditId(b.id);
    setEditName(b.name);
    setEditCity(b.city);
    setEditAddress(b.address || "");
    setEditPhone(b.phone || "");
    setEditHours(b.opening_hours || "");
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/branches/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          city: editCity,
          address: editAddress || null,
          phone: editPhone || null,
          opening_hours: editHours || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update branch.");
      const updated = await res.json();
      setBranches(prev => prev.map(b => b.id === editId ? updated : b));
      setEditId(null);
    } catch {
      alert("Failed to update branch.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "12px", border: "1px solid var(--line)",
    background: "var(--surface-2)", padding: "0.75rem 0.95rem",
    color: "#fff", outline: "none", font: "inherit",
  };

  const labelStyle: React.CSSProperties = { display: "grid", gap: "6px" };
  const spanStyle: React.CSSProperties = { fontSize: "0.84rem", color: "var(--muted)" };

  if (loading) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <div>
            <p className="section-label">Branches</p>
            <h1>Loading branch data...</h1>
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
            <p className="section-label">Branches</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
              Branch locations and operational details.
            </h1>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="button button--primary"
              style={{ padding: "0.85rem 1.6rem", fontSize: "0.95rem" }}
            >
              {showAdd ? "Close" : "＋ Add Branch"}
            </button>
          )}
        </div>

        {/* Add Branch Form */}
        {showAdd && canEdit && (
          <article className="glass-card" style={{ padding: "28px", border: "1px solid var(--accent)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", margin: "0 0 18px", color: "var(--accent)" }}>New Branch</h2>
            {addError && (
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff7373", fontSize: "0.86rem", marginBottom: "16px" }}>
                {addError}
              </div>
            )}
            <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <label style={labelStyle}>
                <span style={spanStyle}>Branch Name *</span>
                <input required value={addName} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddName(e.target.value)} placeholder="e.g. Gulshan Studio" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={spanStyle}>City *</span>
                <input required value={addCity} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddCity(e.target.value)} placeholder="e.g. Dhaka" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={spanStyle}>Address</span>
                <input value={addAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddAddress(e.target.value)} placeholder="Full address" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={spanStyle}>Phone</span>
                <input value={addPhone} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddPhone(e.target.value)} placeholder="+880..." style={inputStyle} />
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                <span style={spanStyle}>Opening Hours</span>
                <input value={addHours} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddHours(e.target.value)} placeholder="e.g. 10:00 AM – 8:00 PM" style={inputStyle} />
              </label>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setShowAdd(false)} className="button button--secondary" style={{ padding: "0.75rem 1.4rem" }}>Cancel</button>
                <button type="submit" disabled={addSubmitting} className="button button--primary" style={{ padding: "0.75rem 1.6rem" }}>
                  {addSubmitting ? "Creating..." : "Create Branch"}
                </button>
              </div>
            </form>
          </article>
        )}

        {/* Branch Cards */}
        <div className="branch-grid">
          {branches.map((branch) => (
            <article key={branch.id} className="glass-card branch-card">
              {editId === branch.id ? (
                /* Edit Mode */
                <form onSubmit={handleEdit} style={{ display: "grid", gap: "12px" }}>
                  <label style={labelStyle}>
                    <span style={spanStyle}>Name</span>
                    <input value={editName} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)} required style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    <span style={spanStyle}>City</span>
                    <input value={editCity} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditCity(e.target.value)} required style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    <span style={spanStyle}>Address</span>
                    <input value={editAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditAddress(e.target.value)} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    <span style={spanStyle}>Phone</span>
                    <input value={editPhone} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditPhone(e.target.value)} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    <span style={spanStyle}>Opening Hours</span>
                    <input value={editHours} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditHours(e.target.value)} style={inputStyle} />
                  </label>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => setEditId(null)} className="button button--secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>Cancel</button>
                    <button type="submit" disabled={editSubmitting} className="button button--primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                      {editSubmitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                /* View Mode */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "10px", marginBottom: "4px" }}>
                    <h3>{branch.name}</h3>
                    <span style={{
                      fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em",
                      padding: "3px 8px", borderRadius: "8px",
                      background: branch.is_active ? "rgba(201,168,76,0.12)" : "rgba(255,100,100,0.1)",
                      color: branch.is_active ? "#C9A84C" : "#ff7c7c",
                      border: `1px solid ${branch.is_active ? "rgba(201,168,76,0.28)" : "rgba(255,100,100,0.2)"}`,
                    }}>
                      {branch.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <dl>
                    <div><dt>City</dt><dd>{branch.city}</dd></div>
                    <div><dt>Address</dt><dd>{branch.address ?? "Not added yet"}</dd></div>
                    {branch.phone && <div><dt>Phone</dt><dd>{branch.phone}</dd></div>}
                    {branch.opening_hours && <div><dt>Hours</dt><dd>{branch.opening_hours}</dd></div>}
                  </dl>
                  {canEdit && (
                    <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => startEdit(branch)} className="button" style={{
                        padding: "6px 14px", fontSize: "0.85rem",
                        color: "var(--accent)", borderColor: "rgba(110,231,255,0.2)",
                        background: "rgba(110,231,255,0.04)",
                      }}>
                        Edit Branch
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
