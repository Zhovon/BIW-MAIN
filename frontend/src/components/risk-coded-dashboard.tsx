"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

type AnalyticsData = {
  snapshot: {
    today_rev: number;
    today_count: number;
    yesterday_rev: number;
    yesterday_count: number;
    last_week_rev: number;
    trailing_avg: number;
  };
  revenue: number;
  count: number;
  avgTicket: number;
  payment: Record<string, number>;
  daily: Record<string, number>;
  prev_daily: Record<string, number>;
  visit_frequency: Record<string, number>;
  hourly: Record<string, number>;
  weekday: Record<string, number>;
  band: Record<string, number>;
  staff_performance: Array<{ name: string; revenue: number; count: number }>;
  utilization_heatmap: Array<{ dow: number; hour: number; staff_name?: string; count: number }>;
  vip_cohort: Array<{ name: string; phone: string; revenue: number; visits: number }>;
  target_amount?: number;
  target_run_rate?: number;
};

type Props = {
  period: "today" | "7d" | "30d" | "month" | "ytd" | "all" | "custom";
  branchId: string;
  customDate: string; // YYYY-MM-DD
  staffName: string;
  paymentMethod: string;
  ticketBand: string;
  staffList: Array<{ id: string; full_name: string }>;
};

export function RiskCodedDashboard({
  period,
  branchId,
  customDate,
  staffName,
  paymentMethod,
  ticketBand,
  staffList
}: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const [heatmapMode, setHeatmapMode] = useState<"all" | "individual">("all");
  const [heatmapStaff, setHeatmapStaff] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const base = getApiBaseUrl();
        const end = new Date();
        const start = new Date();
        
        if (period === "today") {
          start.setHours(0, 0, 0, 0);
        } else if (period === "7d") {
          start.setDate(start.getDate() - 7);
        } else if (period === "30d") {
          start.setDate(start.getDate() - 30);
        } else if (period === "month") {
          start.setDate(1);
        } else if (period === "ytd") {
          start.setMonth(0);
          start.setDate(1);
        } else if (period === "custom") {
          const cd = new Date(customDate);
          start.setTime(cd.getTime());
          end.setTime(cd.getTime());
          end.setHours(23, 59, 59, 999);
        } else if (period === "all") {
          start.setFullYear(2020);
        }

        const query = new URLSearchParams();
        query.append("start_date", start.toISOString());
        query.append("end_date", end.toISOString());
        if (branchId !== "all") query.append("branch_id", branchId);
        if (staffName !== "all") query.append("staff_name", staffName);
        if (paymentMethod !== "all") query.append("payment_method", paymentMethod);
        if (ticketBand !== "all") query.append("ticket_band", ticketBand);

        const res = await authFetch(`${base}/api/v1/analytics/risk-dashboard?${query.toString()}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const channel = getSupabaseBrowserClient()
      .channel('public:sales_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          console.log("Realtime sale update!", payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      getSupabaseBrowserClient().removeChannel(channel);
    };
  }, [period, branchId, customDate, staffName, paymentMethod, ticketBand]);

  const formatTaka = (amount: number): string => {
    return `৳${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { border: { display: false } },
    },
  };

  const heatmapHours = Array.from({ length: 14 }, (_, i) => i + 9); // 9:00 to 22:00
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const aggregatedHeatmap = useMemo(() => {
    if (!data) return {};
    const map: Record<string, { count: number; staffSet: Set<string> }> = {};
    for (let d = 0; d < 7; d++) {
      for (let h = 9; h <= 22; h++) {
        map[`${d}-${h}`] = { count: 0, staffSet: new Set() };
      }
    }
    data.utilization_heatmap.forEach((item) => {
      if (item.hour >= 9 && item.hour <= 22) {
        if (heatmapMode === "all" || heatmapStaff === "all" || item.staff_name === heatmapStaff) {
          const key = `${item.dow}-${item.hour}`;
          if (!map[key]) map[key] = { count: 0, staffSet: new Set() };
          map[key].count += item.count;
          if (item.staff_name) map[key].staffSet.add(item.staff_name);
        }
      }
    });
    return map;
  }, [data, heatmapMode, heatmapStaff]);

  const getHeatmapColor = (dow: number, hour: number) => {
    const val = aggregatedHeatmap[`${dow}-${hour}`]?.count || 0;
    if (val === 0) return "#9c1c1c"; // Risk/Empty (Red)
    if (val < 2) return "#e08828"; // Watch (Orange)
    if (val < 4) return "#8fc15c"; // Acceptable (Light Green)
    return "#0a7d28"; // Strong (Dark Green)
  };

  const deadTimeSlots = useMemo(() => {
    if (!data) return [];
    const slots = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 9; h <= 22; h++) {
        const cell = aggregatedHeatmap[`${d}-${h}`];
        if (cell && cell.staffSet.size >= 1 && cell.count < 8) {
          slots.push({ dow: d, hour: h, count: cell.count, staffCount: cell.staffSet.size });
        }
      }
    }
    return slots.sort((a, b) => a.count - b.count).slice(0, 12);
  }, [aggregatedHeatmap, data]);

  if (!data) return <div style={{ padding: 40, textAlign: "center" }}>Loading analytics...</div>;

  // Chart configs
  const dailyLabels = Object.keys(data.daily).sort();
  const dailyValues = dailyLabels.map((l) => data.daily[l]);
  const avgDaily = dailyValues.reduce((a, b) => a + b, 0) / (dailyValues.length || 1);

  const prevDailyLabels = Object.keys(data.prev_daily || {}).sort();
  const prevDailyValues = prevDailyLabels.map((l) => data.prev_daily[l]);
  const prevAvgDaily = prevDailyValues.reduce((a, b) => a + b, 0) / (prevDailyValues.length || 1);

  // Compute human-readable date range labels for Revenue Story section
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const currentPeriodLabel = dailyLabels.length > 0
    ? `${fmtDate(dailyLabels[0])} – ${fmtDate(dailyLabels[dailyLabels.length - 1])}`
    : "Selected Period";
  const prevPeriodLabel = prevDailyLabels.length > 0
    ? `${fmtDate(prevDailyLabels[0])} – ${fmtDate(prevDailyLabels[prevDailyLabels.length - 1])}`
    : "Previous Period";

  const visitFreqLabels = Object.keys(data.visit_frequency || {}).sort();
  const visitFreqValues = visitFreqLabels.map(l => data.visit_frequency[l]);

  const paymentLabels = Object.keys(data.payment);
  const paymentValues = paymentLabels.map((l) => data.payment[l]);

  const hourlyLabels = Object.keys(data.hourly).map(Number).sort((a, b) => a - b);
  const hourlyValues = hourlyLabels.map((h) => data.hourly[h.toString()]);
  const maxHourly = Math.max(...hourlyValues, 1);

  const weekdayValues = [0, 1, 2, 3, 4, 5, 6].map((d) => data.weekday[d.toString()] || 0);
  const maxWeekday = Math.max(...weekdayValues, 1);

  const snap = data.snapshot;
  const delta = snap.trailing_avg > 0 ? ((snap.today_rev - snap.trailing_avg) / snap.trailing_avg) * 100 : 0;
  const deltaText = delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
  const deltaColor = delta >= 5 ? "#0a7d28" : delta <= -5 ? "#c84c2c" : "#d4b923";

  return (
    <div style={{ background: "#fff", color: "#000", fontFamily: "'Times New Roman', Times, serif" }}>
      {/* Legend */}
      <div style={{ border: "1px solid #000", padding: "8px 14px", marginBottom: 16, fontSize: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontWeight: "bold" }}>Color Scale:</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 12, background: "#0a7d28", border: "1px solid #000" }}></span> Strong / Safe</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 12, background: "#4ba344", border: "1px solid #000" }}></span> Good</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 12, background: "#8fc15c", border: "1px solid #000" }}></span> Acceptable</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 12, background: "#d4b923", border: "1px solid #000" }}></span> Watch</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 12, background: "#e08828", border: "1px solid #000" }}></span> Concern</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 12, background: "#c84c2c", border: "1px solid #000" }}></span> Weak</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 12, background: "#9c1c1c", border: "1px solid #000" }}></span> Risk / Critical</span>
      </div>

      {loading && <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 10 }}>Updating charts...</div>}

      {/* Header Filters & Context */}
      <div className="mobile-grid-1" style={{ 
        border: "1px solid #000", padding: "12px 16px", marginBottom: 16, 
        display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: "16px", alignItems: "center" 
      }}>
        <div style={{ borderRight: "1px solid #000", paddingRight: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>Today&apos;s Snapshot</div>
          <div style={{ fontSize: 16, fontStyle: "italic", marginTop: 2 }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>Revenue Today</div>
          <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 2 }}>{formatTaka(snap.today_rev)}</div>
          <div style={{ fontSize: 11, marginTop: 2, fontStyle: "italic" }}>{snap.today_count} transactions</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>Yesterday</div>
          <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 2 }}>{formatTaka(snap.yesterday_rev)}</div>
          <div style={{ fontSize: 11, marginTop: 2, fontStyle: "italic" }}>{snap.yesterday_count} transactions</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>Same day last week</div>
          <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 2 }}>{formatTaka(snap.last_week_rev)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trailing 4-week avg</div>
          <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 2 }}>{formatTaka(snap.trailing_avg)}</div>
          <div style={{ fontSize: 11, marginTop: 2, fontStyle: "italic" }}>
            <span style={{ background: deltaColor, color: "var(--text)", padding: "1px 5px", fontWeight: "bold" }}>{deltaText}</span>
          </div>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="mobile-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid #000", marginBottom: 18 }}>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #000" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Total Revenue</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>{formatTaka(data.revenue)}</div>
          <div style={{ fontSize: 11, marginTop: 6 }}><span style={{ background: "#0a7d28", color: "var(--text)", padding: "1px 5px", fontWeight: "bold" }}>▲ Good</span></div>
        </div>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #000" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Avg Ticket</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>{formatTaka(data.avgTicket)}</div>
          <div style={{ fontSize: 11, marginTop: 6 }}><span style={{ background: "#4ba344", color: "var(--text)", padding: "1px 5px", fontWeight: "bold" }}>▲ Stable</span></div>
        </div>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #000" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Footfall</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>{data.count} txns</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>Period Volume</div>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Target Run-Rate</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>
            {data?.target_amount ? `${Math.round(data.target_run_rate || 0)}%` : "N/A"}
          </div>
          <div style={{ fontSize: 11, marginTop: 6 }}>
            {data?.target_amount ? (
              <span style={{ background: (data.target_run_rate || 0) >= 100 ? "#4ba344" : "#e08828", color: "var(--text)", padding: "1px 5px", fontWeight: "bold" }}>
                {(data.target_run_rate || 0) >= 100 ? "Target Exceeded" : `Pending Target (${formatTaka(data.target_amount)})`}
              </span>
            ) : (
              <span style={{ background: "#e08828", color: "var(--text)", padding: "1px 5px", fontWeight: "bold" }}>Pending Target Input</span>
            )}
          </div>
        </div>
      </div>

      {/* Section 01 */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>01 · Mid Level - Performance Breakdowns</div>
        <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Daily Revenue (Current Period)</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 4 }}>Green bars = above-average days · Red bars = below-average days</div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 12, fontWeight: "bold" }}>{currentPeriodLabel}</div>
            <div style={{ height: 260 }}>
              <Bar 
                data={{
                  labels: dailyLabels.map((l) => l.substring(5)),
                  datasets: [{
                    label: "Revenue",
                    data: dailyValues,
                    backgroundColor: dailyValues.map((v) => (v >= avgDaily ? "#4ba344" : "#c84c2c")),
                    borderWidth: 1,
                    borderColor: "#000",
                  }],
                }} 
                options={chartOptions} 
              />
            </div>
          </div>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>vs Previous Period</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 4 }}>Same length, immediately before current period</div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 12, fontWeight: "bold" }}>{prevPeriodLabel}</div>
            <div style={{ height: 260 }}>
              <Bar 
                data={{
                  labels: prevDailyLabels.map((l) => l.substring(5)),
                  datasets: [{
                    label: "Revenue",
                    data: prevDailyValues,
                    backgroundColor: prevDailyValues.map((v) => (v >= prevAvgDaily ? "#4ba344" : "#c84c2c")),
                    borderWidth: 1,
                    borderColor: "#000",
                  }],
                }} 
                options={chartOptions} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 02 */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>02 · Distribution Section</div>
        <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Visit Frequency</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>Single visits = retention risk (red)</div>
            <div style={{ height: 220 }}>
              <Doughnut 
                data={{
                  labels: visitFreqLabels,
                  datasets: [{
                    data: visitFreqValues,
                    backgroundColor: visitFreqLabels.map(l => l.startsWith("1") ? "#c84c2c" : "#4ba344"),
                    borderWidth: 1,
                    borderColor: "#000"
                  }]
                }} 
                options={{ responsive: true, maintainAspectRatio: false }} 
              />
            </div>
          </div>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Ticket Size Bands</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>High-ticket = green, low-ticket walk-ins = red</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["10k+", "5k-10k", "2.5k-5k", "1k-2.5k", "500-1k", "0-500"].map((band) => {
                const max = Math.max(...Object.values(data.band));
                const val = data.band[band] || 0;
                const width = max > 0 ? (val / max) * 100 : 0;
                return (
                  <div key={band} style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px", gap: 10, alignItems: "center", fontSize: 12 }}>
                    <div style={{ fontWeight: "bold" }}>{band}</div>
                    <div style={{ height: 14, border: "1px solid #000", background: "#fff" }}>
                      <div style={{ height: "100%", width: `${width}%`, background: band === "0-500" ? "#9c1c1c" : band === "10k+" ? "#0a7d28" : "#000" }}></div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: "bold" }}>{val}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Payment Mix</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>Cash = red (no digital trail for retargeting)</div>
            <div style={{ height: 220 }}>
              <Doughnut 
                data={{
                  labels: paymentLabels,
                  datasets: [{
                    data: paymentValues,
                    backgroundColor: paymentLabels.map(l => l.toLowerCase() === "cash" ? "#c84c2c" : "#4ba344"),
                    borderWidth: 1,
                    borderColor: "#000"
                  }]
                }} 
                options={{ responsive: true, maintainAspectRatio: false }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 03 */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>03 · Heatmap & Time Metrics</div>
        <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Hourly Demand</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>Peak hours = green · Dead hours = red</div>
            <div style={{ height: 220 }}>
              <Bar 
                data={{
                  labels: hourlyLabels.map((h) => `${h}:00`),
                  datasets: [{
                    data: hourlyValues,
                    backgroundColor: hourlyValues.map(v => {
                      const ratio = v / maxHourly;
                      if (ratio >= 0.85) return "#0a7d28";
                      if (ratio >= 0.65) return "#4ba344";
                      if (ratio >= 0.45) return "#d4b923";
                      if (ratio >= 0.25) return "#e08828";
                      return "#9c1c1c";
                    }),
                    borderWidth: 1,
                    borderColor: "#000",
                  }]
                }} 
                options={chartOptions} 
              />
            </div>
          </div>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Weekday Pattern</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>Top revenue days = green · Weakest days = red</div>
            <div style={{ height: 220 }}>
              <Bar 
                data={{
                  labels: weekdayLabels,
                  datasets: [{
                    data: weekdayValues,
                    backgroundColor: weekdayValues.map(v => {
                      const ratio = v / maxWeekday;
                      if (ratio >= 0.85) return "#0a7d28";
                      if (ratio >= 0.65) return "#4ba344";
                      if (ratio >= 0.45) return "#d4b923";
                      if (ratio >= 0.25) return "#e08828";
                      return "#9c1c1c";
                    }),
                    borderWidth: 1,
                    borderColor: "#000"
                  }]
                }} 
                options={chartOptions} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 04 */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>04 · Staff Productivity</div>
        <div style={{ border: "1px solid #000" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #000" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Top Service Providers</div>
            <div style={{ fontSize: 12, fontStyle: "italic" }}>
              Revenue split evenly when multiple staff serve one client · click row to filter · color = quartile of performance
            </div>
          </div>
          <div className="mobile-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", color: "#000", borderBottom: "2px solid #000" }}>
                <th style={{ padding: "8px 12px" }}>Provider</th>
                <th style={{ padding: "8px 12px" }}>Services Rendered</th>
                <th style={{ padding: "8px 12px" }}>Generated Revenue</th>
                <th style={{ padding: "8px 12px" }}>Avg Ticket</th>
                <th style={{ padding: "8px 12px" }}>Risk Status</th>
              </tr>
            </thead>
            <tbody>
              {data.staff_performance.map((staffItem, i) => {
                const avg = staffItem.count > 0 ? staffItem.revenue / staffItem.count : 0;
                let riskColor = "#4ba344"; // green
                let riskText = "Strong";
                const threshold = (data.revenue / Math.max(data.staff_performance.length, 1)) * 0.5;
                if (staffItem.revenue < threshold) {
                   riskColor = "#c84c2c";
                   riskText = "Underperforming";
                }
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{staffItem.name}</td>
                    <td style={{ padding: "8px 12px" }}>{staffItem.count}</td>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{formatTaka(staffItem.revenue)}</td>
                    <td style={{ padding: "8px 12px" }}>{formatTaka(avg)}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ display: "inline-block", background: riskColor, color: "var(--text)", padding: "2px 6px", fontSize: 11, fontWeight: "bold" }}>{riskText}</span>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 05 */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>05 · Utilization Heatmap & Dead-Time Opportunities</div>
        
        <div style={{ border: "1px solid #000", padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: "bold" }}>When is each staff member engaged?</div>
          <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>
            Average services per weekday-hour slot across the full dataset. Green = predictably busy · Red = predictably free.<br/>
            <b>Use the empty slots to schedule promotional content, win-back SMS, or staff training.</b>
          </div>

          <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "center", fontSize: 13 }}>
            <span style={{ fontWeight: "bold" }}>Show:</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button 
                onClick={() => { setHeatmapMode("all"); setHeatmapStaff("all"); }}
                style={{
                  background: heatmapMode === "all" ? "#000" : "#fff",
                  color: heatmapMode === "all" ? "#fff" : "#000",
                  border: "1px solid #000", padding: "4px 10px", fontFamily: "inherit", cursor: "pointer",
                }}
              >All Staff Combined</button>
              <button 
                onClick={() => setHeatmapMode("individual")}
                style={{
                  background: heatmapMode === "individual" ? "#000" : "#fff",
                  color: heatmapMode === "individual" ? "#fff" : "#000",
                  border: "1px solid #000", padding: "4px 10px", fontFamily: "inherit", cursor: "pointer",
                }}
              >Individual Staff</button>
            </div>
            {heatmapMode === "individual" && (
              <>
                <span style={{ fontWeight: "bold" }}>Staff:</span>
                <select value={heatmapStaff} onChange={(e) => setHeatmapStaff(e.target.value)} style={{ padding: "4px 8px", fontFamily: "inherit", border: "1px solid #000" }}>
                  <option value="all">Select Staff...</option>
                  {staffList.map(s => <option key={s.id} value={s.full_name}>{s.full_name}</option>)}
                </select>
              </>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "center" }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 12px", borderRight: "1px solid #ccc" }}>Weekday</th>
                  {heatmapHours.map(h => {
                    const label = h === 12 ? '12PM' : h > 12 ? `${h - 12}PM` : `${h}AM`;
                    return <th key={h} style={{ padding: 4 }}>{label}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {weekdayLabels.map((day, dow) => (
                  <tr key={day}>
                    <td style={{ padding: 4, fontWeight: "bold", textAlign: "right" }}>{day}</td>
                    {heatmapHours.map(hour => {
                      const count = aggregatedHeatmap[`${dow}-${hour}`]?.count || 0;
                      return (
                        <td key={hour} style={{ padding: 2 }}>
                          <div 
                            style={{ 
                              height: 24, width: "100%", minWidth: 24,
                              background: getHeatmapColor(dow, hour),
                              border: "1px solid rgba(0,0,0,0.2)"
                            }}
                            title={`${day} ${hour}:00 - ${count} txns`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
          <div style={{ fontSize: 15, fontWeight: "bold" }}>Dead-Time Opportunities · The Marketing Targets</div>
          <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>
            Weekday-hour slots where multiple staff are consistently free. Each row is an opportunity for an automated promotional trigger.
          </div>
          <div className="mobile-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", color: "#000", borderBottom: "2px solid #000" }}>
                <th style={{ padding: "8px 12px" }}>#</th>
                <th style={{ padding: "8px 12px" }}>Slot</th>
                <th style={{ padding: "8px 12px" }}>Services / Period</th>
                <th style={{ padding: "8px 12px" }}>Staff On-site</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {deadTimeSlots.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 12, textAlign: "center" }}>No opportunity slots identified</td></tr>
              )}
              {deadTimeSlots.map((slot, i) => {
                let cls = "#d4b923", status = "WATCH", action = "Monitor · do not over-promote";
                if (slot.count < 1) { cls = "#9c1c1c"; status = "DEAD ZONE"; action = "Cut hours OR aggressive promo"; }
                else if (slot.count < 3) { cls = "#c84c2c"; status = "COLD"; action = "Scheduled SMS/Instagram blast to lapsed customers"; }
                else if (slot.count < 5) { cls = "#e08828"; status = "COOL"; action = 'Soft promo · "Light morning" express service'; }

                return (
                  <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>
                      {weekdayLabels[slot.dow]} · {slot.hour === 12 ? '12PM' : slot.hour > 12 ? `${slot.hour - 12}PM` : `${slot.hour}AM`}
                    </td>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{slot.count}</td>
                    <td style={{ padding: "8px 12px" }}>{slot.staffCount}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ display: "inline-block", background: cls, color: "var(--text)", padding: "2px 6px", fontSize: 11, fontWeight: "bold" }}>{status}</span>
                    </td>
                    <td style={{ padding: "8px 12px", fontStyle: "italic" }}>{action}</td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 06 */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>06 · High-Value Customer Watchlist</div>
        <div style={{ border: "1px solid #000" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #000" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>VIP Cohort (Selected Period)</div>
            <div style={{ fontSize: 12, fontStyle: "italic" }}>
              Elite/Premium = green priority · One-time high-spenders = red (re-engage urgently)
            </div>
          </div>
          <div className="mobile-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", color: "#000", borderBottom: "2px solid #000" }}>
                <th style={{ padding: "8px 12px" }}>Customer Name</th>
                <th style={{ padding: "8px 12px" }}>Contact</th>
                <th style={{ padding: "8px 12px" }}>Total Spend</th>
                <th style={{ padding: "8px 12px" }}>Visits</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.vip_cohort.map((vip, i) => {
                let status = 'Watch', riskColor = '#d4b923', action = 'Monitor';
                if (vip.revenue >= 20000 && vip.visits >= 2) {
                  status = 'Elite Candidate'; riskColor = '#0a7d28'; action = 'Personal outreach · loyalty Elite tier';
                } else if (vip.visits >= 3) {
                  status = 'Premium Loyal'; riskColor = '#4ba344'; action = 'Upsell to Elite tier';
                } else if (vip.revenue >= 20000) {
                  status = 'High-spend / One-time'; riskColor = '#9c1c1c'; action = 'URGENT re-engage · personal call';
                } else if (vip.revenue >= 10000) {
                  status = 'Mid-spend / Watch'; riskColor = '#e08828'; action = 'Win-back campaign';
                }

                return (
                  <tr key={i} style={{ borderBottom: i === data.vip_cohort.length - 1 ? "none" : "1px solid #ccc" }}>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{vip.name || "Anonymous"}</td>
                    <td style={{ padding: "8px 12px" }}>{vip.phone || "N/A"}</td>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{formatTaka(vip.revenue)}</td>
                    <td style={{ padding: "8px 12px" }}>{vip.visits}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ display: "inline-block", background: riskColor, color: "var(--text)", padding: "2px 6px", fontSize: 11, fontWeight: "bold" }}>{status}</span>
                    </td>
                    <td style={{ padding: "8px 12px", fontStyle: "italic" }}>{action}</td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
