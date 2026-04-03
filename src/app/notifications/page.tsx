"use client";

import { Bell } from "lucide-react";
import { NotificationsFeed } from "@/components/notifications/NotificationsFeed";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-pink/20 to-neon-blue/20">
            <Bell className="size-5 text-white/70" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-white/40">
              Replies, reactions, zaps, reposts, and mentions
            </p>
          </div>
        </div>
      </div>
      <NotificationsFeed />
    </div>
  );
}
