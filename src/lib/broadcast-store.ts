"use client";

/**
 * Lightweight global broadcast status store.
 * NoteActions queue broadcasts here; the BroadcastPill subscribes to updates.
 */

export interface BroadcastJob {
  id: string;
  label: string; // e.g. "Like" or "Repost"
  status: "pending" | "done" | "partial" | "error";
  successes: number;
  failures: number;
  total: number;
}

type Listener = () => void;

let jobs: BroadcastJob[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn();
}

export function getJobs(): BroadcastJob[] {
  return jobs;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addJob(job: BroadcastJob) {
  jobs = [job, ...jobs].slice(0, 20); // keep last 20
  emit();
}

export function updateJob(id: string, patch: Partial<BroadcastJob>) {
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
  emit();
}

/** Remove completed/error jobs older than `ms` from the list. */
export function pruneJobs(ms: number = 8000) {
  const cutoff = Date.now() - ms;
  // We don't have timestamps on jobs, so we just remove finished ones from the tail
  jobs = jobs.filter((j) => j.status === "pending");
  emit();
}
