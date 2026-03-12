"use client";

import { useState, useRef, useEffect } from "react";

interface TruncatedBioProps {
  text: string;
  maxLines?: number;
}

export function TruncatedBio({ text, maxLines = 2 }: TruncatedBioProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Check if text overflows the clamped height
    setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  const lineClampClass: Record<number, string> = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4",
  };

  return (
    <div>
      <p
        ref={ref}
        className={`text-sm text-white/70 leading-relaxed break-words ${!expanded ? (lineClampClass[maxLines] ?? "line-clamp-2") : ""}`}
      >
        {text}
      </p>
      {clamped && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Show more
        </button>
      )}
    </div>
  );
}
