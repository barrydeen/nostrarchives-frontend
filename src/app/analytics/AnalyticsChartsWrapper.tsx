"use client";

import { useState, useCallback } from "react";
import { DailyChart } from "@/components/analytics/DailyChart";
import { TimeframeSwitcher } from "@/components/analytics/TimeframeSwitcher";
import type { DailyAnalyticsEntry } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

interface AnalyticsChartsWrapperProps {
  initialData: DailyAnalyticsEntry[];
}

export function AnalyticsChartsWrapper({ initialData }: AnalyticsChartsWrapperProps) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DailyAnalyticsEntry[]>(initialData);
  const [loading, setLoading] = useState(false);

  const handleTimeframeChange = useCallback(async (newDays: number) => {
    setDays(newDays);

    // If switching back to 30d, use initial server data
    if (newDays === 30 && initialData.length > 0) {
      setData(initialData);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/analytics/daily?days=${newDays}`,
        { headers: { Accept: "application/json" } },
      );
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [initialData]);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daily Trends</h2>
        <TimeframeSwitcher value={days} onChange={handleTimeframeChange} />
      </div>
      <div className={loading ? "opacity-50 transition-opacity" : ""}>
        <DailyChart data={data} />
      </div>
    </div>
  );
}
