import { Metadata } from "next";
import { OnlinePageClient } from "@/components/online/OnlinePageClient";

export const metadata: Metadata = {
  title: "Online Now — Nostr Archives",
  description: "See who is active on the Nostr network right now",
};

export default function OnlinePage() {
  return <OnlinePageClient />;
}
