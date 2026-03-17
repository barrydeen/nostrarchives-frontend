"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { DailyAnalyticsEntry } from "@/lib/types";

interface DailyChartProps {
  data: DailyAnalyticsEntry[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatTooltipValue(value: number): string {
  return value.toLocaleString();
}

interface SingleChartProps {
  data: DailyAnalyticsEntry[];
  dataKey: keyof DailyAnalyticsEntry;
  title: string;
  color: string;
  gradientId: string;
}

function SingleChart({ data, dataKey, title, color, gradientId }: SingleChartProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-white/60">{title}</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.85)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: 13,
              }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value) => [formatTooltipValue(Number(value)), title]}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DailyChart({ data }: DailyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-white/40 py-8 text-center">
        No analytics data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SingleChart
        data={data}
        dataKey="active_users"
        title="Daily Active Users"
        color="#60a5fa"
        gradientId="gradientActiveUsers"
      />
      <SingleChart
        data={data}
        dataKey="zaps_sent"
        title="Daily Zaps Sent"
        color="#c084fc"
        gradientId="gradientZapsSent"
      />
      <SingleChart
        data={data}
        dataKey="notes_posted"
        title="Daily Notes Posted"
        color="#4ade80"
        gradientId="gradientNotesPosted"
      />
    </div>
  );
}
