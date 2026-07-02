"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  availableDates?: Set<string>; // If provided, only these dates are clickable
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function toLocalYMD(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 10);
  return localISOTime;
}

export function BookingCalendar({ value, onChange, availableDates }: BookingCalendarProps) {
  const today = toLocalYMD(new Date());
  
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) {
      const d = new Date(value + "T12:00:00");
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

  return (
    <div className="w-full select-none max-w-sm mx-auto">
      {/* Header: Month + Year Navigation */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-medium text-gray-900">{MONTHS[month]}</span>
          <span className="text-xl text-gray-500">{year}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            disabled={isCurrentMonth}
            className={`p-2 rounded-full flex items-center justify-center transition-colors ${isCurrentMonth ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Day of Week Labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-12 w-full" />;

          const mm = String(month + 1).padStart(2, "0");
          const dd = String(day).padStart(2, "0");
          const dateStr = `${year}-${mm}-${dd}`;
          
          const isSelected = dateStr === value;
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          // If availableDates is provided, check it. Otherwise, assume all future/today are available.
          const isAvailable = !isPast && (!availableDates || availableDates.has(dateStr));

          return (
            <button
              key={day}
              disabled={!isAvailable}
              onClick={() => isAvailable && handleSelect(day)}
              className={`
                h-12 w-full rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 relative
                ${isSelected ? "bg-black text-white shadow-md scale-105" : ""}
                ${!isSelected && isAvailable ? "hover:bg-gray-100 hover:text-black text-gray-700" : ""}
                ${!isAvailable ? "text-gray-300 cursor-not-allowed" : ""}
              `}
            >
              <span className={`relative z-10 ${isToday && !isSelected ? "text-blue-600 font-bold" : ""}`}>
                {day}
              </span>
              {isToday && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
