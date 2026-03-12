import {
  SkeletonPage,
  SkeletonSection,
  SkeletonNoteGrid,
  SkeletonBox,
  SkeletonText,
} from "@/components/layout/Skeleton";

export default function ProfileLoading() {
  return (
    <SkeletonPage>
      {/* Compact profile header skeleton */}
      <div className="rounded-2xl border border-white/10 bg-card/70 p-4 sm:p-5 shadow-xl">
        <div className="flex items-start gap-4">
          <SkeletonBox className="size-16 sm:size-20 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-6 w-36 rounded-full" />
              <SkeletonBox className="h-5 w-24 rounded-full" />
            </div>
            <SkeletonBox className="h-3.5 w-40 rounded-full" />
            <div className="flex gap-4">
              <SkeletonBox className="h-4 w-20 rounded-full" />
              <SkeletonBox className="h-4 w-20 rounded-full" />
              <SkeletonBox className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <SkeletonText lines={2} />
        </div>
      </div>

      {/* Notes feed skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-5 w-16 rounded-full" />
          <SkeletonBox className="h-3.5 w-20 rounded-full" />
        </div>
        <SkeletonNoteGrid count={6} />
      </div>

      {/* Network skeleton */}
      <SkeletonSection>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <SkeletonBox className="h-3.5 w-16 rounded-full" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonBox key={i} className="h-6 w-22 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-3.5 w-16 rounded-full" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonBox key={i} className="h-6 w-22 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </SkeletonSection>
    </SkeletonPage>
  );
}
