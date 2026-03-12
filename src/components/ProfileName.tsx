import { ProfileMetadataEntry } from "@/lib/types";
import { truncateHex } from "@/lib/utils";

interface ProfileNameProps {
  pubkey: string;
  profile?: ProfileMetadataEntry | null;
  showAvatar?: boolean;
  className?: string;
}

export function ProfileName({ pubkey, profile, showAvatar = true, className = "" }: ProfileNameProps) {
  const displayName = profile?.preferred_name || truncateHex(pubkey);
  const picture = profile?.picture;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
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
}
