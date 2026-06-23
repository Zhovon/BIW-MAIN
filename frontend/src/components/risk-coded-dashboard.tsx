"use client";

import React, { useEffect, useState } from "react";
import { getApiBaseUrl, authFetch } from "@/lib/api";
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

type Branch = { id: string; name: string };
type Employee = { id: string; full_name: string };

type AnalyticsData = {
  revenue: number;
  count: number;
  avgTicket: number;
  payment: Record<string, number>;
  daily: Record<string, number>;
  hourly: Record<string, number>;
  weekday: Record<string, number>;
  band: Record<string, number>;
  staff_performance: Array<{ name: string; revenue: number; count: number }>;
  utilization_heatmap: Array<{ dow: number; hour: number; count: number }>;
  vip_cohort: Array<{ name: string; phone: string; revenue: number; visits: number }>;
};

export function RiskCodedDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Employee[]>([]);

  // Filters
  const [period, setPeriod] = useState<"7d" | "30d" | "month" | "ytd">("30d");
  const [branchId, setBranchId] = useState<string>("all");
  const [staffName, setStaffName] = useState<string>("all");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch branches & staff once
    const base = getApiBaseUrl();
    Promise.all([
      authFetch(`${base}/api/v1/branches`).then((res) => res.json()),
      authFetch(`${base}/api/v1/employees`).then((res) => res.json()),
    ]).then(([bData, sData]) => {
      setBranches(bData);
      setStaff(sData);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const base = getApiBaseUrl();
        const end = new Date();
        const start = new Date();
        if (period === "7d") start.setDate(start.getDate() - 7);
        else if (period === "30d") start.setDate(start.getDate() - 30);
        else if (period === "month") start.setDate(1);
        else if (period === "ytd") {
          start.setMonth(0);
          start.setDate(1);
        }

        const query = new URLSearchParams();
        query.append("start_date", start.toISOString());
        query.append("end_date", end.toISOString());
        if (branchId !== "all") query.append("branch_id", branchId);
        if (staffName !== "all") query.append("staff_name", staffName);

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
  }, [period, branchId, staffName]);

  const formatTaka = (amount: number): string => {
    return `৳${Math.round(amount).toLocaleString()}`;
  };

  if (!data) return <div style={{ padding: 40, textAlign: "center" }}>Loading analytics...</div>;

  // Chart configs
  const dailyLabels = Object.keys(data.daily).sort();
  const dailyValues = dailyLabels.map((l) => data.daily[l]);
  const avgDaily = dailyValues.reduce((a, b) => a + b, 0) / (dailyValues.length || 1);

  const dailyChartData = {
    labels: dailyLabels.map((l) => l.substring(5)),
    datasets: [
      {
        label: "Revenue",
        data: dailyValues,
        backgroundColor: dailyValues.map((v) => (v >= avgDaily ? "#4ba344" : "#c84c2c")),
        borderWidth: 1,
        borderColor: "#000",
      },
    ],
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

  const paymentLabels = Object.keys(data.payment);
  const paymentValues = paymentLabels.map((l) => data.payment[l]);
  const paymentData = {
    labels: paymentLabels,
    datasets: [
      {
        data: paymentValues,
        backgroundColor: paymentLabels.map((l) =>
          l.toLowerCase() === "cash" ? "#c84c2c" : "#4ba344"
        ),
        borderWidth: 1,
        borderColor: "#000",
      },
    ],
  };

  const hourlyLabels = Object.keys(data.hourly).map(Number).sort((a, b) => a - b);
  const hourlyValues = hourlyLabels.map((h) => data.hourly[h.toString()]);
  const hourlyData = {
    labels: hourlyLabels.map((h) => `${h}:00`),
    datasets: [
      {
        data: hourlyValues,
        backgroundColor: "#000",
      },
    ],
  };

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdayValues = [0, 1, 2, 3, 4, 5, 6].map((d) => data.weekday[d.toString()] || 0);
  const weekdayData = {
    labels: weekdayLabels,
    datasets: [
      {
        data: weekdayValues,
        backgroundColor: "#000",
      },
    ],
  };

  const heatmapHours = Array.from({ length: 13 }, (_, i) => i + 9); // 9:00 to 21:00
  const getHeatmapColor = (dow: number, hour: number) => {
     const cell = data.utilization_heatmap.find(h => h.dow === dow && h.hour === hour);
     const count = cell ? cell.count : 0;
     if (count === 0) return "#9c1c1c"; // Risk/Empty (Red)
     if (count < 2) return "#e08828"; // Watch (Orange)
     if (count < 4) return "#8fc15c"; // Acceptable (Light Green)
     return "#0a7d28"; // Strong (Dark Green)
  };

  return (
    <div style={{ background: "#fff", color: "#000", fontFamily: "'Times New Roman', Times, serif" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: "bold" }}>Beauty Intelligent Wellness — Operations</div>
          <div style={{ fontSize: 13, fontStyle: "italic" }}>Risk-coded dashboard · Green = safe, Red = attention required</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12 }}>
          <div><b>Data through:</b> {new Date().toLocaleDateString()}</div>
          <div><b>Transactions:</b> {data.count}</div>
          <div><i>{loading ? "Updating..." : "Live"}</i></div>
        </div>
      </header>

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

      {/* Filter Bar */}
      <div style={{ border: "1px solid #000", padding: "12px 14px", marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontWeight: "bold" }}>Range:</span>
          {(["7d", "30d", "month", "ytd"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                background: period === p ? "#000" : "#fff",
                color: period === p ? "#fff" : "#000",
                border: "1px solid #000",
                padding: "4px 10px",
                fontFamily: "inherit",
                cursor: "pointer",
                fontWeight: period === p ? "bold" : "normal",
              }}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "month" ? "This Month" : "YTD"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontWeight: "bold" }}>Branch:</span>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={{ padding: "4px 8px", fontFamily: "inherit", border: "1px solid #000" }}>
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontWeight: "bold" }}>Staff:</span>
          <select value={staffName} onChange={(e) => setStaffName(e.target.value)} style={{ padding: "4px 8px", fontFamily: "inherit", border: "1px solid #000" }}>
            <option value="all">All Staff</option>
            {staff.map(s => <option key={s.id} value={s.full_name}>{s.full_name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid #000", marginBottom: 18 }}>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #000" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Total Revenue</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>{formatTaka(data.revenue)}</div>
          <div style={{ fontSize: 11, marginTop: 6 }}><span style={{ background: "#0a7d28", color: "#fff", padding: "1px 5px", fontWeight: "bold" }}>▲ Good</span></div>
        </div>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #000" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Avg Ticket</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>{formatTaka(data.avgTicket)}</div>
          <div style={{ fontSize: 11, marginTop: 6 }}><span style={{ background: "#4ba344", color: "#fff", padding: "1px 5px", fontWeight: "bold" }}>▲ Stable</span></div>
        </div>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #000" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Footfall</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>{data.count} txns</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>Period Volume</div>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Target Run-Rate</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>N/A</div>
          <div style={{ fontSize: 11, marginTop: 6 }}><span style={{ background: "#e08828", color: "#fff", padding: "1px 5px", fontWeight: "bold" }}>Pending Target Input</span></div>
        </div>
      </div>

      {/* Sections */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>01 · The Revenue Story</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Daily Revenue</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>Green bars = above-average days · Red bars = below-average days</div>
            <div style={{ height: 260 }}>
              <Bar data={dailyChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>02 · Customer & Ticket Mix</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
              <Doughnut data={paymentData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>03 · Time & Staffing</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Hourly Demand</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>Transactions by hour</div>
            <div style={{ height: 220 }}>
              <Bar data={hourlyData} options={chartOptions} />
            </div>
          </div>
          <div style={{ border: "1px solid #000", padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold" }}>Weekday Pattern</div>
            <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>Transactions by day of week</div>
            <div style={{ height: 220 }}>
              <Bar data={weekdayData} options={chartOptions} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>04 · Staff Productivity</div>
        <div style={{ border: "1px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#000", color: "#fff" }}>
                <th style={{ padding: "8px 12px" }}>Provider</th>
                <th style={{ padding: "8px 12px" }}>Services Rendered</th>
                <th style={{ padding: "8px 12px" }}>Generated Revenue</th>
                <th style={{ padding: "8px 12px" }}>Avg Ticket</th>
                <th style={{ padding: "8px 12px" }}>Risk Status</th>
              </tr>
            </thead>
            <tbody>
              {data.staff_performance.map((staff, i) => {
                const avg = staff.count > 0 ? staff.revenue / staff.count : 0;
                let riskColor = "#4ba344"; // green
                let riskText = "Strong";
                const threshold = (data.revenue / Math.max(data.staff_performance.length, 1)) * 0.5;
                if (staff.revenue < threshold) {
                   riskColor = "#c84c2c";
                   riskText = "Underperforming";
                }
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #000" }}>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{staff.name}</td>
                    <td style={{ padding: "8px 12px" }}>{staff.count}</td>
                    <td style={{ padding: "8px 12px" }}>{formatTaka(staff.revenue)}</td>
                    <td style={{ padding: "8px 12px" }}>{formatTaka(avg)}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ display: "inline-block", background: riskColor, color: "#fff", padding: "2px 6px", fontSize: 11, fontWeight: "bold" }}>{riskText}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>05 · Utilization Heatmap</div>
        <div style={{ border: "1px solid #000", padding: "14px 16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "center" }}>
            <thead>
              <tr>
                <th style={{ padding: 4 }}>Day \ Hour</th>
                {heatmapHours.map(h => <th key={h} style={{ padding: 4 }}>{h}:00</th>)}
              </tr>
            </thead>
            <tbody>
              {weekdayLabels.map((day, dow) => (
                <tr key={day}>
                  <td style={{ padding: 4, fontWeight: "bold", textAlign: "right" }}>{day}</td>
                  {heatmapHours.map(hour => (
                    <td key={hour} style={{ padding: 2 }}>
                      <div 
                        style={{ 
                          height: 24, 
                          width: "100%", 
                          minWidth: 24,
                          background: getHeatmapColor(dow, hour),
                          border: "1px solid rgba(0,0,0,0.2)"
                        }}
                        title={`${day} ${hour}:00 - ${data.utilization_heatmap.find(h => h.dow === dow && h.hour === hour)?.count || 0} txns`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "2px solid #000", marginBottom: 10 }}>06 · High-Value Customer Watchlist</div>
        <div style={{ border: "1px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#000", color: "#fff" }}>
                <th style={{ padding: "8px 12px" }}>Customer Name</th>
                <th style={{ padding: "8px 12px" }}>Contact</th>
                <th style={{ padding: "8px 12px" }}>Total Spend</th>
                <th style={{ padding: "8px 12px" }}>Visits</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.vip_cohort.map((vip, i) => (
                  <tr key={i} style={{ borderBottom: i === data.vip_cohort.length - 1 ? "none" : "1px solid #000" }}>
                    <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{vip.name || "Anonymous"}</td>
                    <td style={{ padding: "8px 12px" }}>{vip.phone || "N/A"}</td>
                    <td style={{ padding: "8px 12px" }}>{formatTaka(vip.revenue)}</td>
                    <td style={{ padding: "8px 12px" }}>{vip.visits}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ display: "inline-block", background: "#0a7d28", color: "#fff", padding: "2px 6px", fontSize: 11, fontWeight: "bold" }}>VIP</span>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
