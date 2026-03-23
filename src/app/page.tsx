import { NetworkStatsBarLive } from "@/components/home/NetworkStatsBarLive";
import { TrendingNotesLive } from "@/components/home/TrendingNotesLive";
import { BiggestZappersLive } from "@/components/home/BiggestZappersLive";
import { NewUsersLive } from "@/components/home/NewUsersLive";
import { TrendingUsersLive } from "@/components/home/TrendingUsersLive";
import { TrendingHashtagsLive } from "@/components/home/TrendingHashtagsLive";
import { TopClientsRelaysLive } from "@/components/home/TopClientsRelaysLive";

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

      {/* Tech Stack — full width, below the main grid */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2">
            <svg className="size-5 text-white/60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Tech Stack</h2>
            <p className="text-xs text-white/50">Most popular clients and relays across the network</p>
          </div>
        </div>
        <TopClientsRelaysLive />
      </section>
    </div>
  );
}
