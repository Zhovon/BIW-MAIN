"use client";

import React, { useEffect, useState } from "react";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { InteractiveChart } from "./interactive-chart";

type MarketingData = {
  daily_data: {
    date: string;
    ad_spend: number;
    sales: number;
    impressions: number;
    clicks: number;
  }[];
  total_spend: number;
  total_sales: number;
  roas: number;
};

export function MarketingView() {
  const [data, setData] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch(`${getApiBaseUrl()}/api/v1/analytics/marketing?days=30`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load marketing analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Marketing Data...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Failed to load marketing data.</div>;

  const totalImpressions = data.daily_data.reduce((sum, d) => sum + d.impressions, 0);
  const totalClicks = data.daily_data.reduce((sum, d) => sum + d.clicks, 0);
  const cac = data.total_sales > 0 && data.daily_data.length > 0 ? (data.total_spend / (data.total_sales / 1000)) : 0; // rough proxy for CAC if we assume 1k sales = 1 customer for example. We'll just show actual spend per click.
  const cpc = totalClicks > 0 ? data.total_spend / totalClicks : 0;

  return (
    <article className="glass-card" style={{ padding: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", margin: 0 }}>Native Marketing Engine</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "4px" }}>Real-time ROAS tracked directly against your CRM Sales.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--line)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Ad Spend</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "#ff7c7c", marginTop: "8px" }}>৳{data.total_spend.toLocaleString()}</strong>
        </div>
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--line)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Revenue Generated</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "var(--accent-3)", marginTop: "8px" }}>৳{data.total_sales.toLocaleString()}</strong>
        </div>
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>ROAS (Return on Ad Spend)</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "var(--accent-2)", marginTop: "8px" }}>{data.roas.toFixed(2)}x</strong>
        </div>
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--line)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg. Cost Per Click</span>
          <strong style={{ display: "block", fontSize: "1.4rem", color: "var(--text)", marginTop: "8px" }}>৳{cpc.toFixed(2)}</strong>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ height: "400px", marginTop: "24px", padding: "20px", border: "1px solid var(--line)", borderRadius: "12px", background: "var(--surface-2)" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "16px", color: "var(--text)" }}>Sales vs. Ad Spend (30 Days)</h3>
        <InteractiveChart
          data={data.daily_data}
          xAxisKey="date"
          series={[
            { key: "sales", label: "Sales Revenue", strokeColor: "#C9A84C", fillGradientStart: "#C9A84C", fillGradientEnd: "rgba(201,168,76,0)" },
            { key: "ad_spend", label: "Ad Spend", strokeColor: "#ff7c7c", fillGradientStart: "#ff7c7c", fillGradientEnd: "rgba(255,124,124,0)" },
          ]}
          valueFormatter={(v) => `৳${v.toLocaleString()}`}
        />
      </div>
    </article>
  );
}
