"use client";

import Papa from "papaparse";
import { unzipSync, strFromU8 } from "fflate";
import Link from "next/link";
import { useState } from "react";
import { importChunk } from "@/app/actions/import";
import { IMPORT_LABELS, IMPORT_ORDER, kindFromFilename, toImportRow, type ImportKind, type ImportRow } from "@/lib/import-types";

const CHUNK = 20;

type Parsed = Partial<Record<ImportKind, ImportRow[]>>;
type Progress = Partial<Record<ImportKind, { done: number; imported: number }>>;

function parseCsv(text: string) {
  const out = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return out.data.map(toImportRow).filter((r): r is ImportRow => r !== null);
}

export function ImportFlow({ username }: { username: string }) {
  const [parsed, setParsed] = useState<Parsed>({});
  const [ignored, setIgnored] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress>({});
  const [missed, setMissed] = useState<string[]>([]);
  const [phase, setPhase] = useState<"pick" | "ready" | "running" | "done">("pick");
  const [error, setError] = useState<string | null>(null);

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const next: Parsed = { ...parsed };
    const skipped: string[] = [];
    const take = (path: string, text: string) => {
      if (/(^|\/)(deleted|orphaned)\//i.test(path)) return;
      const kind = kindFromFilename(path);
      if (kind) next[kind] = parseCsv(text);
      else if (path.toLowerCase().endsWith(".csv")) skipped.push(path);
    };
    try {
      for (const file of Array.from(files)) {
        if (file.name.toLowerCase().endsWith(".zip")) {
          const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
          for (const [path, data] of Object.entries(entries)) take(path, strFromU8(data));
        } else {
          take(file.name, await file.text());
        }
      }
    } catch {
      setError("That file couldn't be read. Choose the .zip from your Letterboxd export, or the .csv files inside it.");
      return;
    }
    setParsed(next);
    setIgnored(skipped);
    setPhase(Object.keys(next).length ? "ready" : "pick");
    if (!Object.keys(next).length) setError("None of those files look like a Letterboxd export. Look for diary.csv, ratings.csv or watched.csv.");
  }

  async function run() {
    setPhase("running");
    setMissed([]);
    const allMissed: string[] = [];
    for (const kind of IMPORT_ORDER) {
      const rows = parsed[kind];
      if (!rows?.length) continue;
      let imported = 0;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const res = await importChunk(kind, rows.slice(i, i + CHUNK)).catch(() => ({ imported: 0, missed: [], error: "network" }));
        if (res.error === "network") {
          setError("The connection dropped partway through. Run the import again; anything already imported won't be duplicated.");
          setPhase("ready");
          return;
        }
        imported += res.imported;
        allMissed.push(...res.missed);
        setProgress((p) => ({ ...p, [kind]: { done: Math.min(rows.length, i + CHUNK), imported } }));
      }
    }
    setMissed([...new Set(allMissed)]);
    setPhase("done");
  }

  const kinds = IMPORT_ORDER.filter((k) => parsed[k]?.length);
  const total = kinds.reduce((n, k) => n + parsed[k]!.length, 0);
  const done = kinds.reduce((n, k) => n + (progress[k]?.done ?? 0), 0);

  return (
    <div className="grid gap-6">
      {phase !== "running" && phase !== "done" && (
        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-rule bg-surface px-6 py-10 text-center hover:border-usher">
          <span className="display block text-xl">Choose your export</span>
          <span className="mt-1 block text-sm text-muted">The .zip file, or the .csv files from inside it</span>
          <input type="file" accept=".zip,.csv,text/csv,application/zip" multiple className="sr-only" onChange={(e) => readFiles(e.target.files)} />
        </label>
      )}
      {error && <p role="alert" className="text-sm text-heart">{error}</p>}

      {kinds.length > 0 && (
        <div className="rounded-xl border border-rule bg-surface">
          <ul className="divide-y divide-rule">
            {kinds.map((k) => {
              const rows = parsed[k]!.length;
              const p = progress[k];
              return (
                <li key={k} className="px-4 py-3">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="font-semibold">{IMPORT_LABELS[k]}</span>
                    <span className="text-muted">
                      {p ? `${p.done} of ${rows} checked, ${p.imported} imported` : `${rows.toLocaleString("en-GB")} rows`}
                    </span>
                  </div>
                  {phase !== "ready" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                      <div className="h-full rounded-full bg-usher transition-[width]" style={{ width: `${((p?.done ?? 0) / rows) * 100}%` }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {ignored.length > 0 && <p className="border-t border-rule px-4 py-2 text-xs text-muted">Skipped (not supported yet): {ignored.join(", ")}</p>}
        </div>
      )}

      {phase === "ready" && (
        <div>
          <button className="btn btn-primary" onClick={run}>
            Import {total.toLocaleString("en-GB")} rows
          </button>
          <p className="mt-2 text-sm text-muted">
            Each film is matched on TMDB by title and year, so large exports take a few minutes. Keep this tab open until it finishes.
          </p>
        </div>
      )}
      {phase === "running" && (
        <p role="status" className="text-sm">
          Importing… {Math.round((done / total) * 100)}% done. Keep this tab open.
        </p>
      )}
      {phase === "done" && (
        <div role="status" className="rounded-xl border border-rule bg-surface p-5">
          <p className="display text-2xl">Import finished</p>
          <p className="mt-1 text-muted">
            Your films, diary and watchlist are in.{" "}
            <Link href={`/u/${username}`} className="link">
              Go to your profile
            </Link>
          </p>
          {missed.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm">
                {missed.length} {missed.length === 1 ? "title" : "titles"} couldn&apos;t be matched on TMDB. Log them by hand.
              </summary>
              <ul className="mt-2 max-h-60 list-disc overflow-y-auto pl-5 text-sm text-muted">
                {missed.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
