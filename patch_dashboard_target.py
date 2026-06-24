with open("frontend/src/components/risk-coded-dashboard.tsx", "r") as f:
    content = f.read()

type_injection = """  utilization_heatmap: Array<{ dow: number; hour: number; staff_name?: string; count: number }>;
  vip_cohort: Array<{ name: string; phone: string; revenue: number; visits: number }>;
  target_amount?: number;
  target_run_rate?: number;
};"""

if "target_run_rate?: number;" not in content:
    content = content.replace(
        "  vip_cohort: Array<{ name: string; phone: string; revenue: number; visits: number }>;\n};",
        type_injection
    )

target_html_old = """        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Target Run-Rate</div>
          <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>N/A</div>
          <div style={{ fontSize: 11, marginTop: 6 }}><span style={{ background: "#e08828", color: "var(--text)", padding: "1px 5px", fontWeight: "bold" }}>Pending Target Input</span></div>
        </div>"""

target_html_new = """        <div style={{ padding: "14px 16px" }}>
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
        </div>"""

if target_html_old in content:
    content = content.replace(target_html_old, target_html_new)
    
with open("frontend/src/components/risk-coded-dashboard.tsx", "w") as f:
    f.write(content)

print("Dashboard Target UI patched!")
