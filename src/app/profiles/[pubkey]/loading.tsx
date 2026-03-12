import {
  SkeletonPage,
  SkeletonHeader,
  SkeletonSection,
  SkeletonNoteGrid,
  SkeletonBox,
  SkeletonStatCard,
  SkeletonText,
} from "@/components/layout/Skeleton";

export default function ProfileLoading() {
  return (
    <SkeletonPage>
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-9 w-28 rounded-full" />
      </div>

      <SkeletonHeader />

      {/* Profile card */}
      <SkeletonSection>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <SkeletonBox className="size-32 rounded-3xl" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-9 w-48 rounded-full" />
              <SkeletonBox className="h-6 w-28 rounded-full" />
            </div>
            <SkeletonText lines={2} />
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </SkeletonSection>

      {/* Latest notes */}
      <SkeletonSection title>
        <SkeletonNoteGrid count={6} />
      </SkeletonSection>

      {/* Network */}
      <SkeletonSection>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-20 rounded-full" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonBox key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-20 rounded-full" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonBox key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </SkeletonSection>
    </SkeletonPage>
  );
}
