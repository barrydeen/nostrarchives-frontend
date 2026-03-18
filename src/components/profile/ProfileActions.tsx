"use client";

import { useState, useCallback } from "react";
import { nip19 } from "nostr-tools";
import { Key, ExternalLink, Share2, Zap, X, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ProfileActionsProps {
  pubkey: string;
  lightningAddress?: string | null;
}

// ─── Key / QR Modal ─────────────────────────────────────────────────

function KeyModal({ pubkey, onClose }: { pubkey: string; onClose: () => void }) {
  const [mode, setMode] = useState<"npub" | "hex">("npub");
  const [copied, setCopied] = useState(false);

  const npub = nip19.npubEncode(pubkey);
  const displayed = mode === "npub" ? npub : pubkey;
  const qrValue = mode === "npub" ? npub : pubkey;

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(displayed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [displayed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* panel */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* toggle */}
        <div className="mb-5 flex items-center justify-center gap-1 rounded-full border border-white/10 bg-surface p-1">
          <button
            onClick={() => setMode("npub")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "npub" ? "bg-neon-pink/20 text-neon-pink" : "text-white/50 hover:text-white"
            }`}
          >
            npub
          </button>
          <button
            onClick={() => setMode("hex")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "hex" ? "bg-neon-blue/20 text-neon-blue" : "text-white/50 hover:text-white"
            }`}
          >
            hex
          </button>
        </div>

        {/* QR code */}
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={qrValue} size={200} level="M" />
          </div>
        </div>

        {/* value + copy */}
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 overflow-hidden rounded-lg border border-white/10 bg-surface px-3 py-2 text-[11px] text-white/70 truncate font-mono">
            {displayed}
          </code>
          <button
            onClick={copy}
            className="shrink-0 rounded-lg border border-white/10 bg-surface p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            title="Copy"
          >
            {copied ? <Check className="size-4 text-neon-green" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function ProfileActions({ pubkey, lightningAddress }: ProfileActionsProps) {
  const [showKeys, setShowKeys] = useState(false);

  const openInApp = useCallback(() => {
    const nprofile = nip19.nprofileEncode({ pubkey });
    window.location.href = `nostr:${nprofile}`;
  }, [pubkey]);

  const share = useCallback(async () => {
    const npub = nip19.npubEncode(pubkey);
    const url = `https://nostrarchives.com/profiles/${pubkey}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Nostr profile ${npub.slice(0, 16)}…`, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [pubkey]);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Keys / QR */}
        <button
          onClick={() => setShowKeys(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <QrCode className="size-3.5" />
          Keys
        </button>

        {/* Open in app */}
        <button
          onClick={openInApp}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="size-3.5" />
          Open in App
        </button>

        {/* Share */}
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Share2 className="size-3.5" />
          Share
        </button>

        {/* Lightning address */}
        {lightningAddress && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-300">
            <Zap className="size-3.5 text-amber-400" />
            <span className="truncate max-w-[200px]">{lightningAddress}</span>
          </span>
        )}
      </div>

      {showKeys && <KeyModal pubkey={pubkey} onClose={() => setShowKeys(false)} />}
    </>
  );
}
