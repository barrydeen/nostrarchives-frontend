import {
  SkeletonPage,
  SkeletonHeader,
  SkeletonSection,
  SkeletonNoteGrid,
  SkeletonStatCard,
  SkeletonUserCard,
} from "@/components/layout/Skeleton";

/** Home page loading skeleton */
export default function HomeLoading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />

      {/* Network stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Trending notes */}
      <SkeletonSection title>
        <SkeletonNoteGrid count={6} />
      </SkeletonSection>

      {/* Trending users + new users */}
      <div className="grid gap-10 lg:grid-cols-2">
        <SkeletonSection title>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonUserCard key={i} />
            ))}
          </div>
        </SkeletonSection>
        <SkeletonSection title>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonUserCard key={i} />
            ))}
          </div>
        </SkeletonSection>
      </div>
    </SkeletonPage>
  );
}
