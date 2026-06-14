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
          <h1>{content.title}</h1>
          <p className="dashboard-lead">{content.description}</p>
          <div className="hero__actions">
            <Link className="button button--primary" href={content.primaryAction.href}>
              {content.primaryAction.label}
            </Link>
            <Link className="button button--secondary" href={content.secondaryAction.href}>
              {content.secondaryAction.label}
            </Link>
          </div>
        </div>
        <div className="stat-grid">
          {metricsToRender.map((metric, index) => (
            <article key={metric.label} className="stat-card" style={{ "--accent": ["#C9A84C", "#E8C96A", "#A07830", "#C9A84C"][index % 4] } as React.CSSProperties}>
              <span className="stat-card__label">{metric.label}</span>
              <strong className="stat-card__value">{metric.value}</strong>
            </article>
          ))}
        </div>
      </section>


      <section className="content-grid">
        <div>
          <p className="section-label">Role focus</p>
          <h2>Built for the exact job this role needs to do.</h2>
        </div>
        <div className="capability-grid">
          {content.focus.map((item) => (
            <article key={item} className="glass-card capability-card">
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}