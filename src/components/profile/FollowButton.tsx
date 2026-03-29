"use client";

import { useState, useCallback, useEffect } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchContactList,
  fetchRelayList,
  signEvent,
  publishEvent,
} from "@/lib/nostr-relay";
import type { Event } from "nostr-tools/core";

interface FollowButtonProps {
  pubkey: string;
}

type FollowState =
  | { status: "loading" }
  | { status: "idle"; following: boolean }
  | { status: "publishing" }
  | { status: "error"; following: boolean; message: string };

export function FollowButton({ pubkey }: FollowButtonProps) {
  const { pubkey: myPubkey } = useAuth();
  const [state, setState] = useState<FollowState>({ status: "loading" });

  // Check initial follow status on mount
  useEffect(() => {
    if (!myPubkey || myPubkey === pubkey) {
      setState({ status: "idle", following: false });
      return;
    }

    let cancelled = false;

    fetchContactList(myPubkey)
      .then((event) => {
        if (cancelled) return;
        const isFollowing = event
          ? event.tags.some((t) => t[0] === "p" && t[1] === pubkey)
          : false;
        setState({ status: "idle", following: isFollowing });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "idle", following: false });
      });

    return () => {
      cancelled = true;
    };
  }, [myPubkey, pubkey]);

  const handleToggle = useCallback(async () => {
    if (!myPubkey || state.status !== "idle") return;
    const wasFollowing = state.following;

    setState({ status: "publishing" });

    try {
      // Always fetch the freshest contact list right before modifying
      const latestEvent = await fetchContactList(myPubkey);

      const existingTags: string[][] = latestEvent?.tags ?? [];
      const existingContent = latestEvent?.content ?? "";

      let newTags: string[][];

      if (wasFollowing) {
        // Unfollow: remove the p tag for this pubkey
        newTags = existingTags.filter(
          (t) => !(t[0] === "p" && t[1] === pubkey),
        );
      } else {
        // Follow: add p tag if not already present
        const alreadyFollowing = existingTags.some(
          (t) => t[0] === "p" && t[1] === pubkey,
        );
        newTags = alreadyFollowing
          ? existingTags
          : [...existingTags, ["p", pubkey]];
      }

      const template = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: newTags,
        content: existingContent,
      };

      const signed = await signEvent(template);

      // Publish to our write relays + key relays for propagation
      const relayList = await fetchRelayList(myPubkey);
      const relays = new Set<string>(relayList.write);
      relays.add("wss://indexer.nostrarchives.com");
      relays.add("wss://purplepag.es");
      relays.add("wss://relay.damus.io");
      relays.add("wss://nos.lol");

      const result = await publishEvent(
        [...relays],
        signed as unknown as Event,
      );

      if (result.successes.length > 0) {
        setState({ status: "idle", following: !wasFollowing });
      } else {
        setState({
          status: "error",
          following: wasFollowing,
          message: "All relays rejected the event",
        });
        setTimeout(
          () => setState({ status: "idle", following: wasFollowing }),
          3000,
        );
      }
    } catch (err: unknown) {
      const wasFollowing = state.status === "idle" ? state.following : false;
      const message =
        err instanceof Error ? err.message : "Failed to update follow list";
      setState({ status: "error", following: wasFollowing, message });
      setTimeout(
        () => setState({ status: "idle", following: wasFollowing }),
        3000,
      );
    }
  }, [myPubkey, pubkey, state]);

  // Don't render on own profile or when not logged in
  if (!myPubkey || myPubkey === pubkey) return null;

  if (state.status === "loading") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-white/40"
      >
        <Loader2 className="size-3.5 animate-spin" />
        Loading
      </button>
    );
  }

  const isPublishing = state.status === "publishing";
  const following =
    state.status === "idle"
      ? state.following
      : state.status === "error"
        ? state.following
        : false;

  return (
    <button
      onClick={handleToggle}
      disabled={isPublishing}
      title={state.status === "error" ? state.message : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        following
          ? "border-neon-pink/30 bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20"
          : "border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20"
      }`}
    >
      {isPublishing ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : following ? (
        <UserMinus className="size-3.5" />
      ) : (
        <UserPlus className="size-3.5" />
      )}
      {isPublishing ? "Updating..." : following ? "Unfollow" : "Follow"}
    </button>
  );
}
