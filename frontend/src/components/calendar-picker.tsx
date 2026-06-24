"use client";

import { useState, useMemo } from "react";

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  /** Optional: set of YYYY-MM-DD strings that have entries (shows dot indicator) */
  activeDates?: Set<string>;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function toLocalYMD(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

export function CalendarPicker({ value, onChange, activeDates }: CalendarPickerProps) {
  const today = toLocalYMD(new Date());
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date(value + "T12:00:00");
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleSelect = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
  };

  const goToday = () => {
    onChange(today);
    setViewDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  };

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--line)",
      borderRadius: "16px",
      padding: "16px",
      userSelect: "none",
      minWidth: "260px",
    }}>
      {/* Header: Month + Year Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <button
          onClick={prevMonth}
          style={{
            background: "none", border: "1px solid var(--line)", borderRadius: "8px",
            color: "var(--muted)", width: "30px", height: "30px", cursor: "pointer",
            fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
        >
          ‹
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>
            {MONTHS[month]}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{year}</div>
        </div>

        <button
          onClick={nextMonth}
          style={{
            background: "none", border: "1px solid var(--line)", borderRadius: "8px",
            color: "var(--muted)", width: "30px", height: "30px", cursor: "pointer",
            fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
        >
          ›
        </button>
      </div>

      {/* Day of Week Labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "6px" }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--muted)", fontWeight: 600, padding: "2px 0", letterSpacing: "0.05em" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const mm = String(month + 1).padStart(2, "0");
          const dd = String(day).padStart(2, "0");
          const dateStr = `${year}-${mm}-${dd}`;
          const isSelected = dateStr === value;
          const isToday = dateStr === today;
          const hasEntries = activeDates?.has(dateStr);
          const isFuture = dateStr > today;

          return (
            <button
              key={day}
              onClick={() => !isFuture && handleSelect(day)}
              title={hasEntries ? "Has entries" : undefined}
              style={{
                position: "relative",
                background: isSelected
                  ? "var(--accent)"
                  : isToday
                    ? "rgba(201,168,76,0.1)"
                    : "none",
                border: isSelected
                  ? "1px solid var(--accent)"
                  : isToday
                    ? "1px solid rgba(201,168,76,0.4)"
                    : "1px solid transparent",
                borderRadius: "8px",
                color: isSelected
                  ? "#000"
                  : isFuture
                    ? "rgba(0, 0, 0,0.2)"
                    : "var(--text)",
                cursor: isFuture ? "default" : "pointer",
                fontSize: "0.82rem",
                fontWeight: isSelected || isToday ? 700 : 400,
                padding: "5px 2px",
                textAlign: "center",
                transition: "all 0.12s",
                lineHeight: 1.4,
              }}
              onMouseEnter={e => {
                if (!isSelected && !isFuture) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0, 0, 0,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
                }
              }}
              onMouseLeave={e => {
                if (!isSelected && !isFuture) {
                  (e.currentTarget as HTMLButtonElement).style.background = isToday ? "rgba(201,168,76,0.1)" : "none";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = isToday ? "rgba(201,168,76,0.4)" : "transparent";
                }
              }}
            >
              {day}
              {/* Entry dot indicator */}
              {hasEntries && (
                <span style={{
                  position: "absolute", bottom: "3px", left: "50%",
                  transform: "translateX(-50%)",
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: isSelected ? "rgba(0,0,0,0.5)" : "var(--accent)",
                  display: "block",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Today Button */}
      <button
        onClick={goToday}
        style={{
          marginTop: "12px", width: "100%",
          background: "none", border: "1px solid var(--line)", borderRadius: "8px",
          color: "var(--muted)", fontSize: "0.8rem", padding: "6px",
          cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.04em",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
        }}
      >
        Go to Today
      </button>
    </div>
  );
}
