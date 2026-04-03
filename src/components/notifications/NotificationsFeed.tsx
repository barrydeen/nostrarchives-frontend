"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { SkeletonBox } from "@/components/layout/Skeleton";
import {
  Bell,
  LogIn,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

function SkeletonNotificationRow() {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/[0.06] bg-card/60 p-4">
      <SkeletonBox className="size-9 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <SkeletonBox className="size-5 rounded-full" />
          <SkeletonBox className="h-3.5 w-24 rounded-full" />
          <SkeletonBox className="h-3 w-32 rounded-full" />
        </div>
        <SkeletonBox className="h-3 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

function LoginPrompt() {
  const { login } = useAuth();

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-pink/20 to-neon-blue/20">
        <Bell className="size-8 text-white/60" />
      </div>
      <h2 className="text-xl font-semibold">Sign in to see notifications</h2>
      <p className="mt-2 text-sm text-white/40">
        Log in with your Nostr browser extension to see replies, reactions,
        zaps, and more.
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

function NotificationsLoader({ progress }: { progress: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-card/60 px-4 py-3">
        <Loader2 className="size-4 shrink-0 animate-spin text-neon-blue" />
        <div className="min-w-0">
          <p className="text-sm text-white/70">Loading notifications...</p>
          {progress && <p className="text-xs text-white/30">{progress}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonNotificationRow key={i} />
        ))}
      </div>
    </div>
  );
}

function NotificationsError({
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
      <h2 className="text-xl font-semibold">Failed to load notifications</h2>
      <p className="mt-2 text-sm text-white/40">
        {message || "Something went wrong while fetching your notifications."}
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

function EmptyNotifications() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-white/[0.04]">
        <Bell className="size-8 text-white/40" />
      </div>
      <h2 className="text-xl font-semibold">No notifications yet</h2>
      <p className="mt-2 text-sm text-white/40">
        When people reply to your notes, react, repost, or zap you, those
        notifications will show up here.
      </p>
    </div>
  );
}

export function NotificationsFeed() {
  const { pubkey, loading: authLoading } = useAuth();
  const feed = useNotifications(pubkey);

  if (authLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonNotificationRow key={i} />
        ))}
      </div>
    );
  }

  if (!pubkey) return <LoginPrompt />;

  if (feed.step !== "done" && feed.step !== "error") {
    return <NotificationsLoader progress={feed.progress} />;
  }

  if (feed.step === "error") {
    return <NotificationsError message={feed.error} onRetry={feed.refresh} />;
  }

  if (feed.notifications.length === 0) {
    return <EmptyNotifications />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">
          {feed.notifications.length} notifications
        </p>
        <button
          onClick={feed.refresh}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white/70"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {feed.notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            senderProfile={
              feed.profiles.get(notification.senderPubkey) ?? null
            }
            refNoteProfile={
              notification.referencedEvent
                ? (feed.profiles.get(
                    notification.referencedEvent.pubkey,
                  ) ?? null)
                : null
            }
          />
        ))}
      </div>
    </div>
  );
}
