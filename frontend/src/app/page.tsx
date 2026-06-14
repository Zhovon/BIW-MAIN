"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { InteractiveChart } from "@/components/interactive-chart";
import { HeroVisual } from "@/components/hero-visual";
import { StatCard } from "@/components/stat-card";

const branchCards = [
  {
    name: "Bashundhara Central",
    revenue: "৳12.8L",
    cost: "৳4.2L",
    profit: "৳8.6L",
  },
  {
    name: "Owner Rollup",
    revenue: "৳31.4L",
    cost: "৳10.1L",
    profit: "৳21.3L",
  },
  {
    name: "Employee Bonus Pool",
    revenue: "Service linked",
    cost: "Per treatment",
    profit: "Auto allocated",
  },
];

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

type FinancialChartData = {
  monthly_trend: { month: string; sales: number; revenue: number; costs: number }[];
  branch_comparison: { branch: string; sales: number; revenue: number; costs: number; profit: number }[];
};

type DailyChartData = {
  daily_trend: { date: string; sales: number; costs: number; profit: number }[];
  average_daily_sales: number;
  total_sales: number;
  total_costs: number;
  profit_margin: number;
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

export default function Home() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [financialChartData, setFinancialChartData] = useState<FinancialChartData | null>(null);
  const [dailyChartData, setDailyChartData] = useState<DailyChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const base = getApiBaseUrl();
        const [overviewRes, financialChartRes, dailyChartRes] = await Promise.all([
          fetch(`${base}/api/v1/overview`),
          fetch(`${base}/api/v1/overview/financial-chart`),
          fetch(`${base}/api/v1/overview/daily-chart`),
        ]);

        if (overviewRes.ok && financialChartRes.ok && dailyChartRes.ok) {
          const overviewData = await overviewRes.json();
          const financialData = await financialChartRes.json();
          const dailyData = await dailyChartRes.json();

          setOverview(overviewData);
          setFinancialChartData(financialData);
          setDailyChartData(dailyData);
        }
      } catch (err) {
        console.error("Failed to fetch landing page metrics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Beauty Intelligent Wellness</p>
          <h1>Premium clinic operations with branch, revenue, and payroll intelligence.</h1>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a className="topbar__cta" href="/login">
            Portal Sign In
          </a>
          <a className="topbar__cta" href="#strategy" style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--muted)" }}>
            View Strategy
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <span className="hero__badge">Clinic Intelligence Portal</span>
          <p className="hero__lead">
            A clean, dynamic, premium platform for CRM, sales, revenue, costs, employees,
            and branch-level owner reporting.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href="/login">
              Portal Sign In
            </a>
            <a className="button button--secondary" href="#performance-overview">
              See Live Metrics
            </a>
          </div>
        </div>
        <HeroVisual />
      </section>

      {/* Live Financial Performance Charts Section (Home Page Top) */}
      <section className="content-grid" id="performance-overview" style={{ borderTop: "1px solid var(--line)", paddingTop: "40px", marginBottom: "40px" }}>
        <div>
          <p className="section-label">Live Performance Analytics</p>
          <h2>Consolidated system-wide operations, sales, and expense trends.</h2>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "24px" }}>
          {/* Chart 1: Monthly Financial Trend */}
          <article className="glass-card" style={{ padding: "28px", flex: "1 1 380px", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", margin: "0 0 4px" }}>Monthly Financial Performance</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 20px" }}>
              Comparing consolidated revenue, treatment sales, and operational costs.
            </p>
            <div style={{ marginTop: "auto" }}>
              {financialChartData ? (
                <InteractiveChart
                  data={financialChartData.monthly_trend}
                  xAxisKey="month"
                  series={[
                    { key: "revenue", label: "Gross Revenue", strokeColor: "#E8C96A", fillGradientStart: "#E8C96A", fillGradientEnd: "rgba(232,201,106,0)" },
                    { key: "sales", label: "Treatment Sales", strokeColor: "#C9A84C", fillGradientStart: "#C9A84C", fillGradientEnd: "rgba(201,168,76,0)" },
                    { key: "costs", label: "Operational Costs", strokeColor: "#ff7c7c", fillGradientStart: "#ff7c7c", fillGradientEnd: "rgba(255,124,124,0)" },
                  ]}
                  valueFormatter={(v) => `৳${v.toLocaleString()}`}
                />
              ) : (
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>
                  {loading ? "Loading monthly performance..." : "No data available."}
                </p>
              )}
            </div>
          </article>

          {/* Chart 2: Daily Operations Trend */}
          <article className="glass-card" style={{ padding: "28px", flex: "1 1 380px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", margin: 0 }}>Daily Operations Trend</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                  System-wide treatment sales vs. daily operational expenses.
                </p>
              </div>
              {dailyChartData && (
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--accent)" }}>Net Margin</span>
                  <strong style={{ display: "block", fontSize: "1.15rem", color: "var(--accent-3)", fontFamily: "monospace" }}>
                    {dailyChartData.profit_margin.toFixed(1)}%
                  </strong>
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
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>
                  {loading ? "Loading daily trends..." : "No data available."}
                </p>
              )}
            </div>
          </article>
        </div>
      </section>

      {/* Live Stat Cards */}
      <section className="stat-grid" aria-label="Key metrics" style={{ marginBottom: "40px" }}>
        <StatCard 
          label="Branches" 
          value={overview ? String(overview.branches.length) : "3"} 
          detail="Separate and roll-up reporting" 
        />
        <StatCard 
          label="Consolidated Revenue" 
          value={overview ? formatTaka(overview.revenue_total) : "৳31.4L"} 
          detail="Sales-linked and tracked live" 
          accent="#C9A84C" 
        />
        <StatCard 
          label="Consolidated Profit" 
          value={overview ? formatTaka(overview.profit_total) : "৳21.3L"} 
          detail="Net operations margin" 
          accent="#E8C96A" 
        />
        <StatCard 
          label="Payroll Integration" 
          value="Automated" 
          detail="Service-based bonus allocation" 
          accent="#A07830" 
        />
      </section>

      <section className="content-grid" id="branches">
        <div>
          <p className="section-label">Branch performance</p>
          <h2>Owner sees both individual branch data and the overall picture.</h2>
        </div>
        <div className="branch-grid">
          {overview ? (
            overview.branches.map((branch) => {
              const margin = branch.revenue > 0 ? (branch.profit / branch.revenue) * 100 : 0;
              return (
                <article key={branch.branch} className="glass-card branch-card">
                  <h3>{branch.branch}</h3>
                  <dl>
                    <div>
                      <dt>Revenue</dt>
                      <dd>{formatTaka(branch.revenue)}</dd>
                    </div>
                    <div>
                      <dt>Cost</dt>
                      <dd>{formatTaka(branch.cost)}</dd>
                    </div>
                    <div>
                      <dt>Profit / Margin</dt>
                      <dd style={{ color: branch.profit >= 0 ? "var(--accent-3)" : "#ff7c7c" }}>
                        {formatTaka(branch.profit)} ({margin.toFixed(0)}%)
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })
          ) : (
            branchCards.map((branch) => (
              <article key={branch.name} className="glass-card branch-card">
                <h3>{branch.name}</h3>
                <dl>
                  <div>
                    <dt>Revenue</dt>
                    <dd>{branch.revenue}</dd>
                  </div>
                  <div>
                    <dt>Cost</dt>
                    <dd>{branch.cost}</dd>
                  </div>
                  <div>
                    <dt>Profit</dt>
                    <dd>{branch.profit}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="content-grid" id="strategy">
        <div>
          <p className="section-label">System strategy</p>
          <h2>Designed for a premium, minimal, antigravity-style experience.</h2>
        </div>
        <div className="capability-grid">
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
