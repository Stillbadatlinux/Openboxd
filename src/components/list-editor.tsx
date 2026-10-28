"use client";

import { useState, useTransition } from "react";
import { addFilmToList, moveListItem, removeFilmFromList, setListItemNote } from "@/app/actions/lists";
import type { SearchHit } from "@/lib/types";
import { FilmSearch } from "./film-search";
import { Poster } from "./poster";

type Item = { film: SearchHit; note: string | null };

/** Add, remove, reorder and annotate the films in a list. Changes save as you go. */
export function ListItemsEditor({ listId, ranked, initial }: { listId: string; ranked: boolean; initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    start(async () => {
      setError(null);
      try {
        await fn();
      } catch {
        setError("That change didn't save. Reload the page and try again.");
      }
    });
  }

  function add(film: SearchHit) {
    if (items.some((i) => i.film.id === film.id)) return setError(`${film.title} is already on this list.`);
    setItems((s) => [...s, { film, note: null }]);
    run(() => addFilmToList(listId, film.id));
  }

  function remove(filmId: number) {
    setItems((s) => s.filter((i) => i.film.id !== filmId));
    run(() => removeFilmFromList(listId, filmId));
  }

  function move(index: number, dir: "up" | "down") {
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    run(() => moveListItem(listId, items[index].film.id, dir));
  }

  return (
    <div>
      <FilmSearch onPick={add} placeholder="Add a film to this list" />
      {error && <p role="alert" className="mt-2 text-sm text-heart">{error}</p>}
      <p className="mt-2 h-4 text-xs text-muted" aria-live="polite">
        {pending ? "Saving…" : ""}
      </p>
      <ol className="mt-2 divide-y divide-rule rounded-lg border border-rule bg-surface">
        {items.map((it, i) => (
          <li key={it.film.id} className="flex gap-3 p-3">
            {ranked && <span className="display w-6 shrink-0 pt-1 text-right text-lg text-muted">{i + 1}</span>}
            <div className="w-10 shrink-0">
              <Poster film={it.film} link={false} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {it.film.title} {it.film.year && <span className="font-normal text-muted">{it.film.year}</span>}
              </p>
              <NoteField
                key={it.film.id}
                initial={it.note ?? ""}
                label={`Note for ${it.film.title}`}
                onSave={(note) => run(() => setListItemNote(listId, it.film.id, note))}
              />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, "up")} disabled={i === 0} className="btn btn-quiet px-2 py-0.5" aria-label={`Move ${it.film.title} up`}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, "down")}
                  disabled={i === items.length - 1}
                  className="btn btn-quiet px-2 py-0.5"
                  aria-label={`Move ${it.film.title} down`}
                >
                  ↓
                </button>
              </div>
              <button type="button" onClick={() => remove(it.film.id)} className="text-xs text-muted hover:text-heart">
                Remove
              </button>
            </div>
          </li>
        ))}
        {!items.length && <li className="p-6 text-center text-muted">Search above to add the first film.</li>}
      </ol>
    </div>
  );
}

function NoteField({ initial, label, onSave }: { initial: string; label: string; onSave: (note: string) => void }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  return (
    <textarea
      aria-label={label}
      rows={value ? 2 : 1}
      value={value}
      placeholder="Add a note (optional)"
      maxLength={1000}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== saved) {
          setSaved(value);
          onSave(value);
        }
      }}
      className="mt-1 w-full resize-y rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-rule focus:border-usher focus:outline-none"
    />
  );
}
