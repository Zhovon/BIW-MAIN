import Link from "next/link";

const roleRoutes = [
  {
    href: "/dashboard/owner",
    label: "Owner",
    text: "Finance, permissions, and branch rollups.",
  },
  {
    href: "/dashboard/manager",
    label: "Manager",
    text: "Daily data entry and branch operations.",
  },
  {
    href: "/dashboard/employee",
    label: "Employee",
    text: "Salary, bonus, and assigned services.",
  },
];

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <section className="content-grid">
        <div>
          <p className="section-label">Dashboard routing</p>
          <h1>Choose the correct dashboard for owner, manager, or employee work.</h1>
          <p className="dashboard-lead">
            Each role now has a dedicated route so routing, permissions, and future charts can stay separate.
          </p>
        </div>
        <div className="role-route-grid">
          {roleRoutes.map((item) => (
            <Link key={item.href} href={item.href} className="glass-card role-route-card">
              <p className="section-label">{item.label}</p>
              <h2>{item.text}</h2>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div>
          <p className="section-label">Routing model</p>
          <h2>How the dashboard works now.</h2>
        </div>
        <div className="capability-grid">
          <article className="glass-card capability-card">
            <h3>Owner route</h3>
            <p>Review branch rollups, finance, and permissions.</p>
          </article>
          <article className="glass-card capability-card">
            <h3>Manager route</h3>
            <p>Enter daily operations and assign service activity.</p>
          </article>
          <article className="glass-card capability-card">
            <h3>Employee route</h3>
            <p>See salary, bonus, commission, and assigned work.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
