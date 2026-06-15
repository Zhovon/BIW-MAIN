"use client";

import { StatCard } from "@/components/stat-card";

const capabilityCards = [
  {
    title: "CRM + sales",
    text: "Track leads, consultations, conversions, and service packages in one flow.",
  },
  {
    title: "Branch-wise control",
    text: "Compare branch performance individually while keeping a clean owner summary.",
  },
  {
    title: "Costs + revenue",
    text: "Derive cost from actual service activity, revenue, and operational allocation.",
  },
  {
    title: "Employee service bonus",
    text: "Assign the employee to each service so salary, bonus, and commission are automatic.",
  },
];

export default function Home() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Beauty Intelligent Wellness</p>
          <h1>Internal CRM & Operations Portal</h1>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a className="button button--primary" href="/login">
            Portal Sign In
          </a>
        </div>
      </header>

      <section className="hero" style={{ display: "block", paddingTop: "80px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="hero__copy" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span className="hero__badge">BIW Salon Authorized Personnel Only</span>
          <p className="hero__lead" style={{ margin: "24px auto", fontSize: "1.2rem" }}>
            A secure, dynamic, and premium platform for managing CRM, sales, revenue, costs, employees,
            and branch-level owner reporting.
          </p>
          <div className="hero__actions" style={{ justifyContent: "center", marginTop: "32px" }}>
            <a className="button button--primary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }} href="/login">
              Access Dashboard
            </a>
          </div>
        </div>
      </section>

      {/* Static Core Features */}
      <section className="stat-grid" aria-label="Key System Features" style={{ marginBottom: "80px" }}>
        <StatCard 
          label="Architecture" 
          value="Multi-Branch" 
          detail="Separate and unified reporting" 
        />
        <StatCard 
          label="Payroll Engine" 
          value="Automated" 
          detail="Service-based bonus & commission" 
          accent="#C9A84C" 
        />
        <StatCard 
          label="Financials" 
          value="Live Tracking" 
          detail="Automated P&L calculations" 
          accent="#E8C96A" 
        />
        <StatCard 
          label="Security" 
          value="Role-Based" 
          detail="Strict data access controls" 
          accent="#A07830" 
        />
      </section>

      <section className="content-grid" id="strategy">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p className="section-label">System strategy</p>
          <h2 style={{ margin: "0 auto" }}>Designed for a premium, minimal experience.</h2>
        </div>
        <div className="capability-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: "900px", margin: "0 auto" }}>
          {capabilityCards.map((item) => (
            <article key={item.title} className="glass-card capability-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
