import { Metadata } from "next";
import { getClientLeaderboard } from "@/lib/api";
import { ClientLeaderboard } from "@/components/clients/ClientLeaderboard";

export const metadata: Metadata = {
  title: "Clients",
  description:
    "Leaderboard of Nostr clients ranked by note count and unique users, based on client tags.",
};

export default async function ClientsPage() {
  const data = await getClientLeaderboard(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-white/40">
          Nostr clients ranked by usage — notes published and distinct users, based on client tags.
        </p>
      </div>

      {data && data.clients.length > 0 ? (
        <ClientLeaderboard clients={data.clients} />
      ) : (
        <div className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
          <div className="py-12 text-center text-sm text-white/40">
            No client data available yet.
          </div>
        </div>
      )}
    </div>
  );
}
