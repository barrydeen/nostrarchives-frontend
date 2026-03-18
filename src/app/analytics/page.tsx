import { Metadata } from "next";
import { getClientLeaderboard, getRelayLeaderboard, getDailyAnalytics } from "@/lib/api";
import { ClientCard } from "@/components/analytics/ClientCard";
import { RelayCard } from "@/components/analytics/RelayCard";
import { LeaderboardCard } from "@/components/analytics/LeaderboardCard";
import { AnalyticsChartsWrapper } from "./AnalyticsChartsWrapper";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Network analytics for the Nostr protocol — client usage, activity trends, and more.",
};

export default async function AnalyticsPage() {
  const [clientData, relayData, analyticsData] = await Promise.all([
    getClientLeaderboard(100),
    getRelayLeaderboard(100),
    getDailyAnalytics(30),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-white/40">
          Network-wide statistics and trends across the Nostr protocol.
        </p>
      </div>

      {/* Daily analytics charts */}
      <AnalyticsChartsWrapper initialData={analyticsData?.data ?? []} />

      {/* Leaderboard section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Leaderboards</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <LeaderboardCard type="zappers" />
          <LeaderboardCard type="posters" />
          <LeaderboardCard type="liked" />
          <LeaderboardCard type="shared" />
        </div>
      </div>

      {/* Grid of analytics cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ClientCard clients={clientData?.clients ?? []} />
        <RelayCard relays={relayData?.relays ?? []} />
      </div>
    </div>
  );
}
