"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { setFilmStatus, setWatchlisted } from "@/app/actions/films";
import { addFilmToList, removeFilmFromList } from "@/app/actions/lists";
import type { SearchHit } from "@/lib/types";
import { LogButton } from "./log-dialog";
import { Modal } from "./modal";
import { RatingInput } from "./rating-input";
import { HeartIcon } from "./stars";

type Status = { watched: boolean; liked: boolean; rating: number; watchlisted: boolean };

/** The panel on a film page for watched / like / rating / watchlist / log / lists. */
export function FilmActions({
  film,
  initial,
  lists,
  hasDiaryEntries,
}: {
  film: SearchHit;
  initial: Status;
  /** Whether the member has logged this film before; new entries then default to "rewatch". */
  hasDiaryEntries: boolean;
  lists: { id: string; title: string; hasFilm: boolean; count: number }[];
}) {
  const [status, setOptimistic] = useOptimistic(initial, (s, patch: Partial<Status>) => ({ ...s, ...patch }));
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<Status>) {
    const next = { ...patch };
    if (patch.liked || patch.rating) next.watched = true;
    if (patch.watched === false) Object.assign(next, { liked: false, rating: 0 });
    if (next.watched) next.watchlisted = false;
    start(async () => {
      setOptimistic(next);
      setError(null);
      try {
        if (patch.watchlisted !== undefined) await setWatchlisted(film.id, patch.watchlisted);
        else
          await setFilmStatus(film.id, {
            watched: patch.watched,
            liked: patch.liked,
            rating: patch.rating === undefined ? undefined : patch.rating || null,
          });
      } catch {
        setError("That didn't save. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-rule bg-surface">
      <div className="grid grid-cols-3 border-b border-rule text-sm">
        <Toggle on={status.watched} onClick={() => update({ watched: !status.watched })} label={status.watched ? "Watched" : "Watch"}>
          <EyeIcon filled={status.watched} />
        </Toggle>
        <Toggle on={status.liked} onClick={() => update({ liked: !status.liked })} label={status.liked ? "Liked" : "Like"} tone="heart">
          <HeartIcon filled={status.liked} className="h-6 w-6" />
        </Toggle>
        <Toggle
          on={status.watchlisted}
          onClick={() => update({ watchlisted: !status.watchlisted })}
          label={status.watchlisted ? "In watchlist" : "Watchlist"}
        >
          <ClockIcon filled={status.watchlisted} />
        </Toggle>
      </div>
      <div className="flex flex-col items-center gap-1 border-b border-rule px-4 py-3">
        <span className="text-sm text-muted">{status.rating ? "Your rating" : "Rate"}</span>
        <RatingInput value={status.rating} onChange={(rating) => update({ rating })} size={32} />
      </div>
      <div className="grid gap-2 p-3">
        <LogButton
          film={film}
          label="Review or log…"
          className="btn btn-primary w-full"
          initialRating={status.rating || null}
          initialLiked={status.liked}
          alreadyWatched={hasDiaryEntries}
        />
        <ListPicker film={film} lists={lists} />
      </div>
      {error && <p role="alert" className="px-4 pb-3 text-sm text-heart">{error}</p>}
    </div>
  );
}

function Toggle({
  on,
  onClick,
  label,
  tone = "usher",
  children,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  tone?: "usher" | "heart";
  children: React.ReactNode;
}) {
  const color = on ? (tone === "heart" ? "text-heart" : "text-usher") : "text-muted hover:text-ink";
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`flex flex-col items-center gap-1 py-3 ${color}`}>
      {children}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function ListPicker({ film, lists }: { film: SearchHit; lists: { id: string; title: string; hasFilm: boolean; count: number }[] }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(lists);
  const [pending, start] = useTransition();

  function toggle(listId: string, on: boolean) {
    setState((s) => s.map((l) => (l.id === listId ? { ...l, hasFilm: on, count: l.count + (on ? 1 : -1) } : l)));
    start(async () => {
      if (on) await addFilmToList(listId, film.id);
      else await removeFilmFromList(listId, film.id);
    });
  }

  return (
    <>
      <button type="button" className="btn btn-quiet w-full" onClick={() => setOpen(true)}>
        Add to lists…
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Add “${film.title}” to lists`}>
        {state.length ? (
          <ul className="mb-4 max-h-80 divide-y divide-rule overflow-y-auto rounded-lg border border-rule">
            {state.map((l) => (
              <li key={l.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5">
                  <span>
                    <span className="font-semibold">{l.title}</span>
                    <span className="ml-2 text-sm text-muted">{l.count} films</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={l.hasFilm}
                    disabled={pending}
                    onChange={(e) => toggle(l.id, e.target.checked)}
                    className="h-4 w-4 accent-[var(--usher)]"
                  />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-muted">You haven&apos;t made any lists yet.</p>
        )}
        <Link href={`/lists/new?film=${film.id}`} className="btn btn-quiet">
          Start a new list with this film
        </Link>
      </Modal>
    </>
  );
}

function EyeIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.18 : 0} />
      <circle cx="12" cy="12" r="3" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

function ClockIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.18 : 0} />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
