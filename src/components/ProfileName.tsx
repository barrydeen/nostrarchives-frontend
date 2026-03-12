import Link from "next/link";
import { ProfileMetadataEntry } from "@/lib/types";
import { truncateHex } from "@/lib/utils";

interface ProfileNameProps {
  pubkey: string;
  profile?: ProfileMetadataEntry | null;
  showAvatar?: boolean;
  linked?: boolean;
  className?: string;
}

export function ProfileName({ pubkey, profile, showAvatar = true, linked = true, className = "" }: ProfileNameProps) {
  const displayName = profile?.preferred_name || truncateHex(pubkey);
  const picture = profile?.picture;

  const inner = (
    <span className={`inline-flex items-center gap-2 ${linked ? "hover:text-white transition-colors" : ""} ${className}`}>
      {showAvatar && picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture}
          alt=""
          className="size-5 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : showAvatar ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/60">
          {displayName.charAt(0).toUpperCase()}
        </span>
      ) : null}
      <span className="truncate">{displayName}</span>
    </span>
  );

  if (linked) {
    return (
      <Link href={`/profiles/${pubkey}`} prefetch={false}>
        {inner}
      </Link>
    );
  }

  return inner;
}
