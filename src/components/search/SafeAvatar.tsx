"use client";

import { User2 } from "lucide-react";

export function SafeAvatar({
  src,
  size = "md",
}: {
  src: string | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-9" : "size-12";
  const iconSize = size === "sm" ? "size-4" : "size-5";

  if (!src) {
    return (
      <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-white/10`}>
        <User2 className={`${iconSize} text-white/40`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={`${sizeClass} shrink-0 rounded-full bg-white/10 object-cover`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
