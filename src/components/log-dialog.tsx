"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEntry, saveEntry } from "@/app/actions/films";
import { filmHref, todayISO } from "@/lib/format";
import type { SearchHit } from "@/lib/types";
import { FilmSearch } from "./film-search";
import { Modal } from "./modal";
import { Poster } from "./poster";
import { RatingInput } from "./rating-input";
import { HeartIcon } from "./stars";

export type EntryDraft = {
  id: string;
  watchedOn: string | null; // YYYY-MM-DD
  rating: number | null;
  liked: boolean;
  rewatch: boolean;
  review: string | null;
  spoilers: boolean;
};

type Props = {
  film?: SearchHit;
  entry?: EntryDraft;
  /** Prefill for new entries (e.g. the member's current rating for this film). */
  initialRating?: number | null;
  initialLiked?: boolean;
  alreadyWatched?: boolean;
  label?: string;
  className?: string;
};

export function LogButton({ label = "Log a film", className = "btn btn-primary", ...props }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={props.entry ? "Edit entry" : "Log a film"} wide>
        <LogForm {...props} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function LogForm({ film: presetFilm, entry, initialRating, initialLiked, alreadyWatched, onDone }: Props & { onDone: () => void }) {
  const router = useRouter();
  const [film, setFilm] = useState<SearchHit | undefined>(presetFilm);
  const [dated, setDated] = useState(entry ? Boolean(entry.watchedOn) : true);
  const [rating, setRating] = useState(entry?.rating ?? initialRating ?? 0);
  const [liked, setLiked] = useState(entry?.liked ?? initialLiked ?? false);
  const [review, setReview] = useState(entry?.review ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!film) {
    return (
      <div>
        <p className="mb-3 text-muted">Which film did you watch?</p>
        <FilmSearch onPick={setFilm} autoFocus />
      </div>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await saveEntry(fd);
          if (res.error) return setError(res.error);
          onDone();
          if (fd.get("review")) router.push(`/review/${res.entryId}`);
          else router.refresh();
        })
      }
      className="grid gap-5 sm:grid-cols-[7rem_1fr]"
    >
      <input type="hidden" name="filmId" value={film.id} />
      {entry && <input type="hidden" name="entryId" value={entry.id} />}
      <div className="hidden sm:block">
        <Poster film={film} link={false} />
      </div>
      <div className="grid gap-4">
        <div>
          <p className="display text-xl">
            {film.title} {film.year && <span className="text-muted">{film.year}</span>}
          </p>
          {!presetFilm && !entry && (
            <button type="button" className="text-sm text-muted underline" onClick={() => setFilm(undefined)}>
              Choose a different film
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={dated} onChange={(e) => setDated(e.target.checked)} className="accent-[var(--usher)]" />
            Watched on
          </label>
          {dated && (
            <input
              type="date"
              name="watchedOn"
              required
              max={todayISO()}
              defaultValue={entry?.watchedOn ?? todayISO()}
              className="field w-auto py-1.5"
            />
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" name="rewatch" defaultChecked={entry?.rewatch ?? alreadyWatched ?? false} className="accent-[var(--usher)]" />
            I&apos;ve seen it before
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="label">Rating</span>
            <RatingInput value={rating} onChange={setRating} name="rating" />
          </div>
          <div>
            <span className="label">Like</span>
            <label className={`inline-flex cursor-pointer items-center gap-1.5 ${liked ? "text-heart" : "text-muted"}`}>
              <input type="checkbox" name="liked" checked={liked} onChange={(e) => setLiked(e.target.checked)} className="sr-only peer" />
              <span className="rounded-full p-1 peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--usher)]">
                <HeartIcon filled={liked} className="h-7 w-7" />
              </span>
              <span className="text-sm">{liked ? "Liked" : "Like"}</span>
            </label>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="review">
            Review <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="review"
            name="review"
            rows={6}
            className="field"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What did you think?"
          />
          {review.trim() && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="spoilers" defaultChecked={entry?.spoilers} className="accent-[var(--usher)]" />
              Contains spoilers
            </label>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-heart">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {entry ? (
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete this entry? Its review, likes and comments go with it.")) return;
                start(async () => {
                  await deleteEntry(entry.id);
                  onDone();
                  if (window.location.pathname.startsWith("/review/")) router.push(filmHref(film));
                  else router.refresh();
                });
              }}
            >
              Delete entry
            </button>
          ) : (
            <span />
          )}
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
