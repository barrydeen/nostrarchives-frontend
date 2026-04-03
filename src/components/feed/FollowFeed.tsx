"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useFollowFeed, type FeedStep } from "@/hooks/useFollowFeed";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { SkeletonNoteCard } from "@/components/layout/Skeleton";
import type { StoredEvent } from "@/lib/types";
import {
  LogIn,
  Users,
  Radio,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  Inbox,
} from "lucide-react";

const STEPS: { key: FeedStep; label: string }[] = [
  { key: "fetching-follows", label: "Loading follow list" },
  { key: "fetching-relay-lists", label: "Fetching relay lists" },
  { key: "computing-outbox-plan", label: "Planning relay queries" },
  { key: "fetching-notes", label: "Fetching notes from relays" },
  { key: "resolving-profiles", label: "Resolving profiles" },
];

function stepIndex(step: FeedStep): number {
  const idx = STEPS.findIndex((s) => s.key === step);
  return idx === -1 ? STEPS.length : idx;
}

/** Full stepper shown during first-time relay plan setup. */
function FirstTimeSetup({
  step,
  progress,
}: {
  step: FeedStep;
  progress: string;
}) {
  const current = stepIndex(step);

  return (
    <div className="mx-auto max-w-md space-y-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-pink/20">
          <Radio className="size-6 text-neon-blue" />
        </div>
        <h2 className="text-lg font-semibold">One-time feed setup</h2>
        <p className="mt-1 text-sm text-white/40">
          We&apos;re discovering your follows&apos; relays and building an
          optimal query plan. This only happens once — next time your feed
          will load instantly.
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map((s, i) => {
          const isComplete = i < current;
          const isActive = i === current;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                isActive
                  ? "bg-white/[0.04] border border-white/10"
                  : "opacity-50"
              }`}
            >
              {isComplete ? (
                <Check className="size-4 shrink-0 text-neon-green" />
              ) : isActive ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-neon-blue" />
              ) : (
                <span className="size-4 shrink-0 rounded-full border border-white/20" />
              )}
              <span
                className={`text-sm ${isActive ? "text-white" : "text-white/50"}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {progress && (
        <p className="text-center text-xs text-white/30">{progress}</p>
      )}

      <div className="flex flex-col gap-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonNoteCard key={i} />
        ))}
      </div>
    </div>
  );
}

/** Compact loader shown on subsequent visits when the relay plan is cached. */
function FeedRefreshLoader({
  step,
  progress,
}: {
  step: FeedStep;
  progress: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-card/60 px-4 py-3">
        <Loader2 className="size-4 shrink-0 animate-spin text-neon-blue" />
        <div className="min-w-0">
          <p className="text-sm text-white/70">
            {step === "fetching-notes"
              ? "Fetching latest notes..."
              : step === "resolving-profiles"
                ? "Resolving profiles..."
                : "Loading feed..."}
          </p>
          {progress && (
            <p className="text-xs text-white/30">{progress}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonNoteCard key={i} />
        ))}
      </div>
    </div>
  );
}

function LoginPrompt() {
  const { login } = useAuth();

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-pink/20 to-neon-blue/20">
        <LogIn className="size-8 text-white/60" />
      </div>
      <h2 className="text-xl font-semibold">Sign in to see your feed</h2>
      <p className="mt-2 text-sm text-white/40">
        Log in with your Nostr browser extension to see notes from people you
        follow.
      </p>
      <button
        onClick={() => login().catch(() => {})}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-pink/20 to-neon-blue/20 px-6 py-2.5 text-sm font-medium text-white transition hover:from-neon-pink/30 hover:to-neon-blue/30"
      >
        <LogIn className="size-4" />
        Login with Extension
      </button>
    </div>
  );
}

function FeedError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertCircle className="size-8 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold">Failed to load feed</h2>
      <p className="mt-2 text-sm text-white/40">
        {message || "Something went wrong while building your feed."}
      </p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </div>
  );
}

function EmptyFeed({ followCount }: { followCount: number }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-white/[0.04]">
        {followCount === 0 ? (
          <Users className="size-8 text-white/40" />
        ) : (
          <Inbox className="size-8 text-white/40" />
        )}
      </div>
      <h2 className="text-xl font-semibold">
        {followCount === 0 ? "No follows yet" : "No recent notes"}
      </h2>
      <p className="mt-2 text-sm text-white/40">
        {followCount === 0
          ? "You're not following anyone yet. Explore profiles and follow people to build your feed."
          : "None of your follows have posted recently, or their notes couldn't be found on their relays."}
      </p>
    </div>
  );
}

export function FollowFeed() {
  const { pubkey, loading: authLoading } = useAuth();
  const feed = useFollowFeed(pubkey);

  if (authLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonNoteCard key={i} />
        ))}
      </div>
    );
  }

  if (!pubkey) return <LoginPrompt />;

  if (feed.step !== "done" && feed.step !== "error") {
    // First-time: show full stepper. Subsequent: compact loader.
    return feed.isFirstSetup ? (
      <FirstTimeSetup step={feed.step} progress={feed.progress} />
    ) : (
      <FeedRefreshLoader step={feed.step} progress={feed.progress} />
    );
  }

  if (feed.step === "error") {
    return <FeedError message={feed.error} onRetry={feed.refresh} />;
  }

  if (feed.notes.length === 0) {
    return <EmptyFeed followCount={feed.followCount} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">
          {feed.notes.length} notes from {feed.followCount} follows
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={feed.rebuildRelayPlan}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-white/30 transition hover:bg-white/10 hover:text-white/50"
            title="Clear cached relay plan and rebuild from scratch (use after changing your follow list)"
          >
            <Radio className="size-3" />
            Rebuild relays
          </button>
          <button
            onClick={feed.refresh}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white/70"
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {feed.notes.map((event) => {
          const profile = feed.profiles.get(event.pubkey) ?? null;
          return (
            <UnifiedNoteCard
              key={event.id}
              event={event as unknown as StoredEvent}
              profile={profile}
              profiles={feed.profiles}
              variant="default"
            />
          );
        })}
      </div>
    </div>
  );
}
