import Link from "next/link";
import { Flame, Zap, Repeat2, MessageCircle, Heart, Clock } from "lucide-react";
import { TrendingNote, ProfileMetadataEntry } from "@/lib/types";
import { formatNumber, formatRelative, extractHashtags } from "@/lib/utils";
import { ProfileName } from "@/components/ProfileName";

interface TrendingNotesProps {
  notes: TrendingNote[];
  profiles: Map<string, ProfileMetadataEntry>;
}

export function TrendingNotes({ notes, profiles }: TrendingNotesProps) {
  if (!notes.length) {
    return (
      <section>
        <SectionHeader />
        <p className="text-sm text-white/40">No trending notes in the last 24 hours.</p>
      </section>
    );
  }

  const [hero, ...rest] = notes;

  return (
    <section>
      <SectionHeader />
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Hero card */}
        <div className="lg:col-span-7">
          <HeroCard note={hero} profile={profiles.get(hero.event.pubkey)} rank={1} />
        </div>
        {/* Side stack */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {rest.slice(0, 4).map((note, i) => (
            <CompactCard key={note.event.id} note={note} profile={profiles.get(note.event.pubkey)} rank={i + 2} />
          ))}
        </div>
      </div>
      {/* Additional cards below */}
      {rest.length > 4 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(4).map((note, i) => (
            <CompactCard key={note.event.id} note={note} profile={profiles.get(note.event.pubkey)} rank={i + 6} />
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="rounded-xl bg-neon-pink/10 p-2">
        <Flame className="size-5 text-neon-pink" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Trending Notes</h2>
        <p className="text-xs text-white/50">Highest engagement in the last 24 hours</p>
      </div>
    </div>
  );
}

function EngagementBar({ note }: { note: TrendingNote }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
      {note.zap_sats > 0 && (
        <span className="inline-flex items-center gap-1 text-neon-amber">
          <Zap className="size-3" />
          {formatNumber(note.zap_sats)} sats
        </span>
      )}
      {note.reposts > 0 && (
        <span className="inline-flex items-center gap-1">
          <Repeat2 className="size-3" />
          {formatNumber(note.reposts)}
        </span>
      )}
      {note.replies > 0 && (
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-3" />
          {formatNumber(note.replies)}
        </span>
      )}
      {note.reactions > 0 && (
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3" />
          {formatNumber(note.reactions)}
        </span>
      )}
    </div>
  );
}

function HeroCard({ note, profile, rank }: { note: TrendingNote; profile?: ProfileMetadataEntry | null; rank: number }) {
  const tags = extractHashtags(note.event.tags);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-neon-pink/[0.06] via-card/80 to-card/80 p-6 backdrop-blur-xl transition hover:border-white/15">
      <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-neon-pink/[0.04]" />
      <div className="flex items-center justify-between">
        <ProfileName pubkey={note.event.pubkey} profile={profile} className="text-sm text-white/70" />
        <span className="rounded-full bg-neon-pink/15 px-3 py-1 font-mono text-xs font-semibold text-neon-pink">
          #{rank}
        </span>
      </div>
      <p className="mt-4 flex-1 text-base leading-relaxed text-white/90 line-clamp-5">
        {note.event.content || "—"}
      </p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[11px] text-white/50">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <EngagementBar note={note} />
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatRelative(note.event.created_at)}
          </span>
          <Link href={`/notes/${note.event.id}`} className="text-white/60 underline-offset-2 hover:text-white hover:underline">
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}

function CompactCard({ note, profile, rank }: { note: TrendingNote; profile?: ProfileMetadataEntry | null; rank: number }) {
  return (
    <Link
      href={`/notes/${note.event.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-card/60 p-4 backdrop-blur transition hover:border-white/15 hover:bg-card/80"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-xs font-bold text-white/40">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ProfileName pubkey={note.event.pubkey} profile={profile} className="text-xs text-white/60" showAvatar={true} linked={false} />
          <span className="text-[10px] text-white/30">{formatRelative(note.event.created_at)}</span>
        </div>
        <p className="mt-1 text-sm text-white/80 line-clamp-2">{note.event.content || "—"}</p>
        <div className="mt-2">
          <EngagementBar note={note} />
        </div>
      </div>
    </Link>
  );
}
