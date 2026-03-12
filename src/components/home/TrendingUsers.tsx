import Link from "next/link";
import { TrendingUp, UserPlus } from "lucide-react";
import { TrendingUser, ProfileMetadataEntry } from "@/lib/types";
import { formatNumber, truncateHex } from "@/lib/utils";

interface TrendingUsersProps {
  users: TrendingUser[];
  profiles: Map<string, ProfileMetadataEntry>;
}

export function TrendingUsers({ users, profiles }: TrendingUsersProps) {
  if (!users.length) {
    return (
      <section>
        <SectionHeader />
        <p className="text-sm text-white/40">No trending users in the last 24 hours.</p>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {users.map((user, index) => {
          const profile = profiles.get(user.pubkey);
          const name = profile?.preferred_name || truncateHex(user.pubkey);
          const picture = profile?.picture;

          return (
            <Link
              key={user.pubkey}
              href={`/profiles/${user.pubkey}`}
              prefetch={false}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-card/60 p-4 backdrop-blur transition hover:border-white/15 hover:bg-card/80"
            >
              {index < 3 && (
                <span className="absolute right-3 top-3 font-mono text-[10px] font-bold text-neon-blue/40">
                  #{index + 1}
                </span>
              )}
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={picture}
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover ring-2 ring-neon-blue/20"
                  loading="lazy"
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neon-blue/10 text-sm font-bold text-neon-blue/60 ring-2 ring-neon-blue/20">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                  {name}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-neon-blue/60">
                  <UserPlus className="size-3" />
                  +{formatNumber(user.new_followers)} followers
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="rounded-xl bg-neon-blue/10 p-2">
        <TrendingUp className="size-5 text-neon-blue" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Trending Users</h2>
        <p className="text-xs text-white/50">Most new followers in the last 24 hours</p>
      </div>
    </div>
  );
}
