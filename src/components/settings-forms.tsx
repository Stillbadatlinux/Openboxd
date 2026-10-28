"use client";

import { useActionState, useState, useTransition } from "react";
import { changePassword, setFavorites, updateProfile } from "@/app/actions/settings";
import type { SearchHit } from "@/lib/types";
import { FilmSearch } from "./film-search";
import { Poster } from "./poster";

type ProfileValues = { username: string; displayName: string | null; bio: string | null; location: string | null; website: string | null };

export function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input id="username" name="username" defaultValue={profile.username} required pattern="[A-Za-z0-9_]{2,20}" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="displayName">
            Display name
          </label>
          <input id="displayName" name="displayName" defaultValue={profile.displayName ?? ""} maxLength={60} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <input id="location" name="location" defaultValue={profile.location ?? ""} maxLength={80} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="website">
            Website
          </label>
          <input id="website" name="website" type="url" placeholder="https://" defaultValue={profile.website ?? ""} className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="bio">
          Bio
        </label>
        <textarea id="bio" name="bio" rows={4} maxLength={1000} defaultValue={profile.bio ?? ""} className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-heart">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-usher">{state.message}</p>}
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

export function FavoritesPicker({ initial }: { initial: SearchHit[] }) {
  const [films, setFilms] = useState(initial);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save(next: SearchHit[]) {
    setFilms(next);
    start(async () => {
      try {
        await setFavorites(next.map((f) => f.id));
        setMessage("Favourites saved.");
      } catch {
        setMessage("Favourites didn't save. Try again.");
      }
    });
  }

  return (
    <div>
      <ul className="mb-4 grid max-w-md grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => {
          const f = films[i];
          return (
            <li key={i}>
              {f ? (
                <div>
                  <Poster film={f} link={false} />
                  <button type="button" className="mt-1 text-xs text-muted hover:text-heart" onClick={() => save(films.filter((x) => x.id !== f.id))}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="aspect-[2/3] rounded-[4px] border border-dashed border-rule" aria-hidden />
              )}
            </li>
          );
        })}
      </ul>
      {films.length < 4 ? (
        <FilmSearch placeholder="Add a favourite film" onPick={(f) => !films.some((x) => x.id === f.id) && save([...films, f])} />
      ) : (
        <p className="text-sm text-muted">Remove one to choose another.</p>
      )}
      <p className="mt-2 h-4 text-sm text-muted" aria-live="polite">
        {pending ? "Saving…" : message}
      </p>
    </div>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="grid max-w-sm gap-4">
      <div>
        <label className="label" htmlFor="current">
          Current password
        </label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="next">
          New password
        </label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-heart">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-usher">{state.message}</p>}
      <div>
        <button className="btn btn-quiet" disabled={pending}>
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
