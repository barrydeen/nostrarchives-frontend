"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Radio, Check, AlertTriangle } from "lucide-react";
import {
  getJobs,
  subscribe,
  type BroadcastJob,
} from "@/lib/broadcast-store";

export function BroadcastPill() {
  const jobs = useSyncExternalStore(subscribe, getJobs, getJobs);
  const pendingCount = jobs.filter((j) => j.status === "pending").length;
  const recentDone = jobs.filter(
    (j) => j.status === "done" || j.status === "partial"
  );
  const recentErrors = jobs.filter((j) => j.status === "error");

  const visible = useVisibility(jobs);

  if (!visible || jobs.length === 0) return null;

  const hasPending = pendingCount > 0;
  const hasErrors = recentErrors.length > 0;
  const hasPartial = jobs.some((j) => j.status === "partial");

  let pillColor = "bg-white/10 text-white/60 border-white/10";
  let Icon = Radio;
  let label = "";

  if (hasPending) {
    pillColor = "bg-neon-blue/10 text-neon-blue border-neon-blue/20";
    Icon = Radio;
    label = pendingCount === 1 ? "Broadcasting..." : `Broadcasting ${pendingCount}...`;
  } else if (hasErrors && recentDone.length === 0) {
    pillColor = "bg-red-400/10 text-red-400 border-red-400/20";
    Icon = AlertTriangle;
    label = "Broadcast failed";
  } else if (hasPartial || hasErrors) {
    pillColor = "bg-amber-400/10 text-amber-400 border-amber-400/20";
    Icon = AlertTriangle;
    label = "Partially sent";
  } else {
    pillColor = "bg-green-400/10 text-green-400 border-green-400/20";
    Icon = Check;
    label = recentDone.length === 1
      ? `${recentDone[0].label} sent to ${recentDone[0].successes} relay${recentDone[0].successes !== 1 ? "s" : ""}`
      : `${recentDone.length} actions broadcast`;
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition-all ${pillColor}`}
    >
      <Icon className={`size-3.5 ${hasPending ? "animate-pulse" : ""}`} />
      <span>{label}</span>
    </div>
  );
}

/**
 * Returns true while there are jobs, then stays true for a delay after
 * all jobs finish so the user can see the result.
 */
function useVisibility(jobs: BroadcastJob[]): boolean {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const hasPending = jobs.some((j) => j.status === "pending");
    const hasJobs = jobs.length > 0;

    if (hasPending) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
    } else if (hasJobs) {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 4000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [jobs]);

  return visible;
}
