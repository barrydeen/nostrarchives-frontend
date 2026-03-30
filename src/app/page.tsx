import { NetworkStatsBarLive } from "@/components/home/NetworkStatsBarLive";
import { TrendingNotesLive } from "@/components/home/TrendingNotesLive";
import { BiggestZappersLive } from "@/components/home/BiggestZappersLive";
import { NewUsersLive } from "@/components/home/NewUsersLive";
import { TrendingUsersLive } from "@/components/home/TrendingUsersLive";
import { TrendingHashtagsLive } from "@/components/home/TrendingHashtagsLive";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <NetworkStatsBarLive />
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Trending Notes (narrower) */}
        <div className="lg:col-span-5">
          <TrendingNotesLive />
        </div>
        {/* Right: User Discovery */}
        <div className="flex flex-col gap-8 lg:col-span-7">
          <BiggestZappersLive />
          <TrendingHashtagsLive />
          <NewUsersLive />
          <TrendingUsersLive />
        </div>
      </div>
    </div>
  );
}
