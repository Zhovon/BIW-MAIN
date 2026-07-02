import Link from "next/link";

type RoleDashboardProps = {
  role: "owner" | "manager" | "employee";
  dynamicMetrics?: { label: string; value: string }[];
};

const roleCopy = {
  owner: {
    label: "Owner dashboard",
    title: "Own the financial picture, permissions, and branch oversight.",
    description:
      "Review revenue, cost, profit, payroll, and the employee role structure across every branch.",
    primaryAction: { href: "/dashboard/owner", label: "Open owner view" },
    secondaryAction: { href: "/employees", label: "Edit employees" },
    metrics: [
      { label: "Revenue", value: "৳31.4L" },
      { label: "Cost", value: "৳10.1L" },
      { label: "Profit", value: "৳21.3L" },
      { label: "Branches", value: "3" },
    ],
    focus: [
      "Edit manager permissions and employee positions.",
      "Review daily, monthly, and yearly finance trends.",
      "Keep all branch data aligned to one owner summary.",
    ],
  },
  manager: {
    label: "Manager dashboard",
    title: "Enter daily operations and keep the branch data accurate.",
    description:
      "Capture services performed, revenue, costs, and service-to-employee assignments before the owner reviews them.",
    primaryAction: { href: "/dashboard/manager", label: "Open manager view" },
    secondaryAction: { href: "/services", label: "Review services" },
    metrics: [
      { label: "Today\'s revenue", value: "৳1.28L" },
      { label: "Today\'s cost", value: "৳42K" },
      { label: "Services", value: "18" },
      { label: "Assigned staff", value: "12" },
    ],
    focus: [
      "Record daily service activity and branch expenses.",
      "Assign the employee who performed each service.",
      "Flag exceptions for owner approval.",
    ],
  },
  employee: {
    label: "Employee dashboard",
    title: "See salary, bonus, assigned services, and performance clearly.",
    description:
      "Track personal earnings, service assignments, and commission-linked activity without exposing branch-wide admin controls.",
    primaryAction: { href: "/dashboard/employee", label: "Open employee view" },
    secondaryAction: { href: "/services", label: "Check services" },
    metrics: [
      { label: "Salary", value: "৳32K" },
      { label: "Bonus", value: "৳6.2K" },
      { label: "Services", value: "14" },
      { label: "Commission", value: "4%" },
    ],
    focus: [
      "See the services assigned to you.",
      "Understand current bonus and commission totals.",
      "Keep the view limited to personal data.",
    ],
  },
} as const;

export function RoleDashboard({ role, dynamicMetrics }: RoleDashboardProps) {
  const content = roleCopy[role];
  const metricsToRender = dynamicMetrics ?? content.metrics;

  return (
    <main className="page-shell">
      <section className="content-grid">
        <div>
          <p className="section-label">{content.label}</p>
          <h1 style={{ fontFamily: "Times New Roman, serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", fontSize: "clamp(2rem, 3.5vw, 3.5rem)", lineHeight: 1.1, margin: "0 0 16px" }}>{content.title}</h1>
          <p className="dashboard-lead">{content.description}</p>
          <div className="hero__actions">
            <Link className="" style={{ background: "#000", color: "#fff", border: "1px solid #000", padding: "10px 16px", cursor: "pointer", fontFamily: "Times New Roman, serif", textTransform: "uppercase", fontWeight: "bold", display: "inline-block", textAlign: "center" }} href={content.primaryAction.href}>
              {content.primaryAction.label}
            </Link>
            <Link className="" style={{ background: "#fff", color: "#000", border: "1px solid #000", padding: "10px 16px", cursor: "pointer", fontFamily: "Times New Roman, serif", textTransform: "uppercase", fontWeight: "bold", display: "inline-block", textAlign: "center" }} href={content.secondaryAction.href}>
              {content.secondaryAction.label}
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-black mb-8">
          {metricsToRender.map((metric, index) => (
            <article key={metric.label} className="p-4 border-b md:border-b-0 md:border-r border-black last:border-r-0 bg-white" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000", marginBottom: "6px" }}>{metric.label}</span>
              <strong style={{ fontSize: "26px", fontWeight: "bold", color: "#000", lineHeight: 1 }}>{metric.value}</strong>
            </article>
          ))}
        </div>
      </section>


      <section className="content-grid">
        <div>
          <p className="section-label">Role focus</p>
          <h2 style={{ fontFamily: "Times New Roman, serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", fontSize: "24px", margin: "0 0 8px", borderBottom: "2px solid #000", paddingBottom: "8px" }}>Built for the exact job this role needs to do.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-black mt-6">
          {content.focus.map((item) => (
            <article key={item} className="p-6 border-b md:border-b-0 md:border-r border-black last:border-r-0 bg-white">
              <h3 style={{ fontSize: "16px", margin: 0, fontWeight: "bold", fontFamily: "Times New Roman, serif", color: "#000" }}>{item}</h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}