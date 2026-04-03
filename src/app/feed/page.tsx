import { FollowFeed } from "@/components/feed/FollowFeed";

export const metadata = {
  title: "Feed",
  description: "Notes from people you follow on Nostr.",
};

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feed</h1>
        <p className="mt-1 text-sm text-white/40">
          Notes from people you follow, fetched directly from their relays.
        </p>
      </div>
      <FollowFeed />
    </div>
  );
}
