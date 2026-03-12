import Link from "next/link";
import { Zap, Heart, ArrowUpRight } from "lucide-react";
import { truncateHex } from "@/lib/utils";

interface SpotlightProfile {
  pubkey: string;
  likes: number;
  zaps: number;
}

interface ProfileSpotlightProps {
  profiles: SpotlightProfile[];
}

export function ProfileSpotlight({ profiles }: ProfileSpotlightProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-card/80 via-surface/60 to-card/40 p-6 shadow-2xl">
      <div className="flex flex-col gap-2 border-b border-white/5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">People to watch</p>
          <h2 className="text-3xl font-semibold">Creators compounding attention</h2>
        </div>
        <span className="text-sm text-white/60">Derived from top likes + zaps</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {profiles.map((profile) => (
          <Link
            key={profile.pubkey}
            href={`/profiles/${profile.pubkey}`}
            className="group rounded-2xl border border-white/10 bg-surface/80 p-5 transition hover:border-white/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">{truncateHex(profile.pubkey)}</p>
                <h3 className="text-2xl font-semibold">{(profile.likes + profile.zaps).toLocaleString()} signals</h3>
              </div>
              <ArrowUpRight className="size-5 text-white/60 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <div className="mt-4 flex gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-4 text-neon-pink" />
                {profile.likes.toLocaleString()} likes
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap className="size-4 text-neon-amber" />
                {profile.zaps.toLocaleString()} zaps
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
