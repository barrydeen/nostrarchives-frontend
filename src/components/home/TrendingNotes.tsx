import { Flame } from "lucide-react";
import { TrendingNote, ProfileMetadataEntry } from "@/lib/types";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";

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
          <UnifiedNoteCard
            event={hero.event}
            profile={profiles.get(hero.event.pubkey)}
            profiles={profiles}
            engagement={{
              reactions: hero.reactions,
              replies: hero.replies,
              reposts: hero.reposts,
              zap_sats: hero.zap_sats,
            }}
            variant="hero"
            rank={1}
          />
        </div>
        {/* Side stack */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {rest.slice(0, 4).map((note, i) => (
            <UnifiedNoteCard
              key={note.event.id}
              event={note.event}
              profile={profiles.get(note.event.pubkey)}
              profiles={profiles}
              engagement={{
                reactions: note.reactions,
                replies: note.replies,
                reposts: note.reposts,
                zap_sats: note.zap_sats,
              }}
              variant="compact"
              rank={i + 2}
            />
          ))}
        </div>
      </div>
      {/* Additional cards below */}
      {rest.length > 4 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(4).map((note, i) => (
            <UnifiedNoteCard
              key={note.event.id}
              event={note.event}
              profile={profiles.get(note.event.pubkey)}
              profiles={profiles}
              engagement={{
                reactions: note.reactions,
                replies: note.replies,
                reposts: note.reposts,
                zap_sats: note.zap_sats,
              }}
              variant="default"
              rank={i + 6}
            />
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
