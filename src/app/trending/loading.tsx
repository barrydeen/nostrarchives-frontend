import {
  SkeletonPage,
  SkeletonBox,
  SkeletonNoteGrid,
} from "@/components/layout/Skeleton";

export default function TrendingLoading() {
  return (
    <SkeletonPage>
      {/* Title */}
      <div className="space-y-2">
        <SkeletonBox className="h-9 w-40 rounded-full" />
        <SkeletonBox className="h-4 w-72 rounded-full" />
      </div>

      {/* Metric tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      {/* Range tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} className="h-8 flex-1 rounded-xl" />
        ))}
      </div>

      <SkeletonNoteGrid count={6} />
    </SkeletonPage>
  );
}
