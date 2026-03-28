"use client";

import { useState } from "react";
import { Hash, TrendingUp } from "lucide-react";
import Link from "next/link";
import { TrendingHashtag } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface TrendingHashtagsProps {
  hashtags: TrendingHashtag[];
}

export function TrendingHashtags({ hashtags }: TrendingHashtagsProps) {
  const [blockedTags] = useState<Set<string>>(new Set());
  const visibleHashtags = hashtags.filter((t) => !blockedTags.has(t.hashtag));

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-neon-pink/10 p-2">
          <TrendingUp className="size-5 text-neon-pink" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Trending Topics</h2>
          <p className="text-xs text-white/50">Most popular hashtags in the last 24 hours</p>
        </div>
      </div>

      {!visibleHashtags.length ? (
        <p className="text-sm text-white/40">No trending hashtags right now.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {visibleHashtags.map((tag, index) => (
            <div key={tag.hashtag} className="flex items-center gap-0.5">
              <Link
                href={`/search?q=%23${encodeURIComponent(tag.hashtag)}`}
                prefetch={false}
                className="group relative flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-card/60 px-3 py-1.5 backdrop-blur transition hover:border-neon-pink/20 hover:bg-card/80"
              >
                {index < 3 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-neon-pink/80 text-[9px] font-bold text-white">
                    {index + 1}
                  </span>
                )}
                <Hash className="size-3.5 text-neon-pink/60" />
                <span className="text-sm font-medium text-white/80 group-hover:text-white">
                  {tag.hashtag}
                </span>
                <span className="text-[11px] text-white/30">
                  {formatNumber(tag.count)}
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
