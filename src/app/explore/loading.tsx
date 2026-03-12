import {
  SkeletonPage,
  SkeletonHeader,
  SkeletonSection,
  SkeletonNoteGrid,
  SkeletonBox,
} from "@/components/layout/Skeleton";

export default function ExploreLoading() {
  return (
    <SkeletonPage>
      {/* Back link */}
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-9 w-28 rounded-full" />
      </div>

      <SkeletonHeader />

      {/* Filter form */}
      <SkeletonSection title>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <SkeletonBox className="h-12 rounded-2xl" />
          <SkeletonBox className="h-12 rounded-2xl" />
          <SkeletonBox className="h-12 rounded-2xl md:col-span-2" />
        </div>
      </SkeletonSection>

      {/* Results */}
      <SkeletonSection title>
        <SkeletonNoteGrid count={6} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
