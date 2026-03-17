import { Metadata } from "next";
import { getClientLeaderboard } from "@/lib/api";
import { ClientCard } from "@/components/analytics/ClientCard";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Network analytics for the Nostr protocol — client usage, activity trends, and more.",
};

export default async function AnalyticsPage() {
  const clientData = await getClientLeaderboard(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-white/40">
          Network-wide statistics and trends across the Nostr protocol.
        </p>
      </div>

      {/* Grid of analytics cards — more sections will go here */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ClientCard clients={clientData?.clients ?? []} />
      </div>
    </div>
  );
}
