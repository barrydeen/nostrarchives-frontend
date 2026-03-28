import { SkeletonPage, SkeletonBox } from "@/components/layout/Skeleton";

export default function OnlineLoading() {
  return (
    <SkeletonPage>
      {/* Header */}
      <div className="flex items-center gap-4">
        <SkeletonBox className="size-12 rounded-xl" />
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-48 rounded-full" />
          <SkeletonBox className="h-4 w-64 rounded-full" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-card/60 p-4"
          >
            <SkeletonBox className="size-14 rounded-full" />
            <SkeletonBox className="h-4 w-20 rounded" />
            <SkeletonBox className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
