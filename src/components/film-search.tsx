"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";
import { posterUrl } from "@/lib/format";
import type { SearchHit } from "@/lib/types";

/** Type-ahead film search backed by /api/search. Calls onPick with the chosen film. */
export function FilmSearch({
  onPick,
  placeholder = "Search for a film",
  autoFocus = false,
}: {
  onPick: (film: SearchHit) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { results: SearchHit[]; error?: string };
        setResults(data.results);
        setError(data.error ?? (data.results.length ? null : `No films match “${term}”. Try the original title or fewer words.`));
        setActive(0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Film search is unavailable right now.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function pick(hit: SearchHit) {
    onPick(hit);
    setQ("");
    setResults([]);
  }

  return (
    <div className="relative">
      <input
        className="field"
        type="search"
        value={q}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          if (e.target.value.trim().length < 2) {
            setResults([]);
            setError(null);
          }
        }}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") setActive((a) => Math.min(results.length - 1, a + 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
          else if (e.key === "Enter") pick(results[active]);
          else return;
          e.preventDefault();
        }}
      />
      {loading && <span className="absolute right-3 top-2.5 text-xs text-muted">Searching…</span>}
      {error && !results.length && <p className="mt-2 text-sm text-muted">{error}</p>}
      {results.length > 0 && (
        <ul id={listId} role="listbox" className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-rule bg-surface">
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-${r.id}`}
              role="option"
              aria-selected={i === active}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-paper" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(r)}
            >
              <span className="block h-12 w-8 shrink-0 overflow-hidden rounded-[3px] bg-rule">
                {r.posterPath && <img src={posterUrl(r.posterPath, "w92")!} alt="" className="h-full w-full object-cover" />}
              </span>
              <span>
                <span className="font-semibold">{r.title}</span>
                {r.year && <span className="ml-1.5 text-muted">{r.year}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
