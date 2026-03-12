import { ReactNode } from "react";
import { formatNumber } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value?: number;
  hint?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card/60 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{label}</span>
        {icon && <span className="text-white/80">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{formatNumber(value)}</p>
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </div>
  );
}
