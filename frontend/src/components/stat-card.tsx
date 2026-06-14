import type { CSSProperties } from "react";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  accent?: string;
};

export function StatCard({ label, value, detail, accent = "#C9A84C" }: StatCardProps) {
  return (
    <article className="stat-card" style={{ "--accent": accent } as CSSProperties}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <p className="stat-card__detail">{detail}</p>
    </article>
  );
}
