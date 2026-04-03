"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ComposeBarProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  sending?: boolean;
  statusText?: string;
}

export function ComposeBar({
  onSend,
  disabled,
  sending,
  statusText,
}: ComposeBarProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!content.trim() || disabled || sending) return;
    onSend(content.trim());
    setContent("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, disabled, sending, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Auto-grow textarea
  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  return (
    <div className="border-t border-white/5 bg-background/80 px-4 py-3">
      {statusText && (
        <div className="mb-2 flex items-center gap-2 text-xs text-white/40">
          <Loader2 className="size-3 animate-spin" />
          {statusText}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          disabled={disabled || sending}
          rows={1}
          className="min-h-[2.5rem] max-h-[120px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/20 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled || sending}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neon-pink/10 text-neon-pink transition hover:bg-neon-pink/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
