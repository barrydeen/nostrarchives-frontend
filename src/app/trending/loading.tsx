import {
  SkeletonPage,
  SkeletonHeader,
  SkeletonSection,
  SkeletonNoteGrid,
  SkeletonBox,
} from "@/components/layout/Skeleton";

export default function TrendingLoading() {
  return (
    <SkeletonPage>
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-9 w-28 rounded-full" />
      </div>

      <SkeletonHeader />

      <div className="space-y-6">
        {["Likes · Today", "Likes · All time", "Zaps · Today", "Zaps · All time"].map(
          (title) => (
            <SkeletonSection key={title} title>
              <SkeletonNoteGrid count={4} />
            </SkeletonSection>
          )
        )}
      </div>
    </SkeletonPage>
  );
}
