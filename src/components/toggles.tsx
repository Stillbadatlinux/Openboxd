"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { setEntryLiked, setFollowing, setListLiked } from "@/app/actions/social";
import { HeartIcon } from "./stars";

export function FollowButton({ userId, following, signedIn }: { userId: string; following: boolean; signedIn: boolean }) {
  const [on, set] = useOptimistic(following);
  const [pending, start] = useTransition();
  if (!signedIn)
    return (
      <Link href="/login" className="btn btn-primary">
        Follow
      </Link>
    );
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={on}
      className={on ? "btn btn-quiet" : "btn btn-primary"}
      onClick={() =>
        start(async () => {
          set(!on);
          await setFollowing(userId, !on);
        })
      }
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}

function LikeToggle({
  liked,
  count,
  signedIn,
  onToggle,
  noun,
}: {
  liked: boolean;
  count: number;
  signedIn: boolean;
  onToggle: (on: boolean) => Promise<void>;
  noun: string;
}) {
  const [state, set] = useOptimistic({ liked, count });
  const [, start] = useTransition();
  const label = `${state.count.toLocaleString("en-GB")} ${state.count === 1 ? "like" : "likes"}`;
  if (!signedIn)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <HeartIcon filled={false} /> {label}
      </span>
    );
  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={state.liked ? `Unlike this ${noun}` : `Like this ${noun}`}
      className={`inline-flex items-center gap-1.5 text-sm ${state.liked ? "text-heart" : "text-muted hover:text-ink"}`}
      onClick={() =>
        start(async () => {
          const on = !state.liked;
          set({ liked: on, count: state.count + (on ? 1 : -1) });
          await onToggle(on);
        })
      }
    >
      <HeartIcon filled={state.liked} /> {label}
    </button>
  );
}

export function EntryLikeButton({ entryId, ...p }: { entryId: string; liked: boolean; count: number; signedIn: boolean }) {
  return <LikeToggle {...p} noun="review" onToggle={(on) => setEntryLiked(entryId, on)} />;
}

export function ListLikeButton({ listId, ...p }: { listId: string; liked: boolean; count: number; signedIn: boolean }) {
  return <LikeToggle {...p} noun="list" onToggle={(on) => setListLiked(listId, on)} />;
}
