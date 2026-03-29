import { Metadata } from "next";
import { getClientLeaderboard } from "@/lib/api";
import { ClientExplorer } from "./ClientExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client Usage",
  description:
    "Explore Nostr client usage — see which clients are most popular and who uses them.",
};

export default async function ClientsPage() {
  const data = await getClientLeaderboard(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Usage</h1>
        <p className="mt-1 text-sm text-white/40">
          Nostr clients ranked by usage. Click any client to see its top users.
        </p>
      </div>

      <ClientExplorer clients={data?.clients ?? []} />
    </div>
  );
}
