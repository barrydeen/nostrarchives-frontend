import { Suspense } from "react";
import { FeedTabs } from "@/components/feed/FeedTabs";

export const metadata = {
  title: "Feeds",
  description: "Explore notes from your follows, trending content, or any relay.",
};

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feeds</h1>
        <p className="mt-1 text-sm text-white/40">
          Explore notes from your follows, trending content, or any relay.
        </p>
      </div>
      <Suspense>
        <FeedTabs />
      </Suspense>
    </div>
  );
}
