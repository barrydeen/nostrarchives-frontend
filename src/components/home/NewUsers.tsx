import Link from "next/link";
import { UserPlus, Clock } from "lucide-react";
import { NewUser, ProfileMetadataEntry } from "@/lib/types";
import { formatRelative, truncateHex } from "@/lib/utils";

interface NewUsersProps {
  users: NewUser[];
  profiles: Map<string, ProfileMetadataEntry>;
}

export function NewUsers({ users, profiles }: NewUsersProps) {
  if (!users.length) {
    return (
      <section>
        <SectionHeader />
        <p className="text-sm text-white/40">No new users in the last 24 hours.</p>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const profile = profiles.get(user.pubkey);
          const name = profile?.preferred_name || truncateHex(user.pubkey);
          const picture = profile?.picture;

          return (
            <Link
              key={user.pubkey}
              href={`/profiles/${user.pubkey}`}
              prefetch={false}
              className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-card/60 p-4 backdrop-blur transition hover:border-white/15 hover:bg-card/80"
            >
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={picture}
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover ring-2 ring-neon-green/20"
                  loading="lazy"
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neon-green/10 text-sm font-bold text-neon-green/60 ring-2 ring-neon-green/20">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                  {name}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-white/40">
                  <Clock className="size-3" />
                  {formatRelative(user.first_seen)}
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
      <div className="rounded-xl bg-neon-green/10 p-2">
        <UserPlus className="size-5 text-neon-green" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">New Users</h2>
        <p className="text-xs text-white/50">Recently joined the network</p>
      </div>
    </div>
  );
}
