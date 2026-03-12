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

  return (
    <section>
      <SectionHeader />
      <div className="flex flex-col gap-4">
        {notes.slice(0, 10).map((note, i) => (
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
            variant={i === 0 ? "hero" : "compact"}
            rank={i + 1}
          />
        ))}
      </div>
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
