"use client";

const floatingCards = [
  {
    title: "Owner view",
    value: "All branches",
    background: "linear-gradient(135deg, rgba(110, 231, 255, 0.16), rgba(255, 255, 255, 0.05))",
  },
  {
    title: "Revenue",
    value: "Live dashboard",
    background: "linear-gradient(135deg, rgba(156, 123, 255, 0.18), rgba(255, 255, 255, 0.05))",
  },
  {
    title: "Payroll",
    value: "Service bonuses",
    background: "linear-gradient(135deg, rgba(142, 240, 178, 0.18), rgba(255, 255, 255, 0.05))",
  },
];

export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual__orb hero-visual__orb--one" />
      <div className="hero-visual__orb hero-visual__orb--two" />
      <div className="hero-visual__panel">
        <div className="hero-visual__header">
          <span>Beauty Intelligent Wellness</span>
          <span>Bashundhara</span>
        </div>
        <div className="hero-visual__metrics">
          {floatingCards.map((card) => (
            <div
              key={card.title}
              className="hero-visual__metric"
              style={{ background: card.background }}
            >
              <span>{card.title}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
