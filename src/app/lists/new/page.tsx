import type { Metadata } from "next";
import { ListDetailsForm } from "@/components/list-forms";
import { Poster } from "@/components/poster";
import { ensureFilm } from "@/lib/films";
import { requireViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "New list" };

export default async function NewListPage({ searchParams }: { searchParams: Promise<{ film?: string }> }) {
  const filmParam = Number((await searchParams).film) || undefined;
  await requireViewer(`/lists/new${filmParam ? `?film=${filmParam}` : ""}`);
  const film = filmParam ? await ensureFilm(filmParam).catch(() => null) : null;
  return (
    <div className="wrap max-w-xl py-10">
      <h1 className="display mb-6 text-4xl">New list</h1>
      {film && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-rule bg-surface p-3">
          <div className="w-10">
            <Poster film={film} link={false} />
          </div>
          <p className="text-sm">
            Starting with <span className="font-semibold">{film.title}</span>. You can add more films on the next page.
          </p>
        </div>
      )}
      <ListDetailsForm filmId={film?.id} />
    </div>
  );
}
