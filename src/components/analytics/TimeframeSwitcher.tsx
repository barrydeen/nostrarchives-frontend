"use client";

interface TimeframeSwitcherProps {
  value: number;
  onChange: (days: number) => void;
}

const options = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "1Y", days: 365 },
];

export function TimeframeSwitcher({ value, onChange }: TimeframeSwitcherProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {options.map((opt) => (
        <button
          key={opt.days}
          onClick={() => onChange(opt.days)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            value === opt.days
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
