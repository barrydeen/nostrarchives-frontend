/**
 * Reusable skeleton primitives for loading states.
 */

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/[0.04] ${className}`}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 animate-pulse rounded-full bg-white/[0.04]"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

/** Standard page shell matching site layout */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return <div className="space-y-10">{children}</div>;
}

/** Skeleton matching SiteHeader dimensions */
export function SkeletonHeader() {
  return (
    <div className="mb-10 rounded-3xl border border-white/5 bg-surface/80 px-6 py-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBox className="size-9 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBox className="h-3 w-24 rounded-full" />
            <SkeletonBox className="h-6 w-40 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-9 w-20 rounded-full" />
          <SkeletonBox className="h-9 w-20 rounded-full" />
          <SkeletonBox className="h-9 w-20 rounded-full" />
        </div>
      </div>
      <SkeletonBox className="mt-4 h-10 max-w-2xl rounded-2xl" />
    </div>
  );
}

/** Skeleton matching a note card */
export function SkeletonNoteCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBox className="size-8 rounded-full" />
        <SkeletonBox className="h-3.5 w-28 rounded-full" />
        <SkeletonBox className="ml-auto h-3 w-16 rounded-full" />
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-4">
        <SkeletonBox className="h-3 w-12 rounded-full" />
        <SkeletonBox className="h-3 w-12 rounded-full" />
        <SkeletonBox className="h-3 w-12 rounded-full" />
      </div>
    </div>
  );
}

/** Grid of skeleton note cards */
export function SkeletonNoteGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNoteCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a section wrapper */
export function SkeletonSection({
  title,
  children,
}: {
  title?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
      {title && (
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <SkeletonBox className="h-7 w-48 rounded-full" />
          <SkeletonBox className="h-4 w-20 rounded-full" />
        </div>
      )}
      {children}
    </section>
  );
}

/** Skeleton for a stat card */
export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface/80 p-4 space-y-2">
      <SkeletonBox className="h-3 w-16 rounded-full" />
      <SkeletonBox className="h-7 w-24 rounded-full" />
    </div>
  );
}

/** Skeleton for a user chip/card */
export function SkeletonUserCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <SkeletonBox className="size-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonBox className="h-3.5 w-28 rounded-full" />
        <SkeletonBox className="h-3 w-20 rounded-full" />
      </div>
    </div>
  );
}
