import {
  SkeletonPage,
  SkeletonHeader,
  SkeletonSection,
  SkeletonBox,
  SkeletonText,
  SkeletonNoteCard,
} from "@/components/layout/Skeleton";

export default function NoteLoading() {
  return (
    <SkeletonPage>
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-9 w-28 rounded-full" />
      </div>

      <SkeletonHeader />

      {/* Main note */}
      <SkeletonSection>
        <div className="flex items-center gap-3">
          <SkeletonBox className="size-8 rounded-full" />
          <SkeletonBox className="h-3.5 w-28 rounded-full" />
          <SkeletonBox className="h-3 w-16 rounded-full" />
        </div>
        <div className="mt-4">
          <SkeletonText lines={5} />
        </div>
        <div className="mt-6 flex gap-4">
          <SkeletonBox className="h-4 w-24 rounded-full" />
          <SkeletonBox className="h-4 w-20 rounded-full" />
          <SkeletonBox className="h-4 w-20 rounded-full" />
          <SkeletonBox className="h-4 w-16 rounded-full" />
        </div>
      </SkeletonSection>

      {/* Replies */}
      <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
        <SkeletonBox className="h-6 w-32 rounded-full" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonNoteCard key={i} />
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
