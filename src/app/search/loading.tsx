import {
  SkeletonBox,
  SkeletonHeader,
  SkeletonUserCard,
  SkeletonNoteCard,
} from "@/components/layout/Skeleton";

export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <SkeletonHeader />

      {/* Search bar placeholder */}
      <div className="mb-8 max-w-2xl">
        <SkeletonBox className="h-10 rounded-2xl" />
      </div>

      {/* Results heading */}
      <SkeletonBox className="mb-6 h-6 w-48 rounded-full" />

      {/* Type filter tabs */}
      <div className="mb-6 flex gap-2">
        <SkeletonBox className="h-8 w-14 rounded-full" />
        <SkeletonBox className="h-8 w-20 rounded-full" />
        <SkeletonBox className="h-8 w-16 rounded-full" />
      </div>

      <div className="space-y-8">
        {/* Profiles */}
        <section>
          <SkeletonBox className="mb-4 h-4 w-20 rounded-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonUserCard key={i} />
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <SkeletonBox className="mb-4 h-4 w-16 rounded-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonNoteCard key={i} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
