import type { Metadata } from "next";
import { ImportFlow } from "@/components/import-flow";
import { requireViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Import from Letterboxd" };

export default async function ImportPage() {
  const viewer = await requireViewer("/settings/import");
  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="display mb-3 text-4xl">Import from Letterboxd</h1>
      <div className="mb-8 grid gap-2 text-muted">
        <p>
          On Letterboxd, go to Settings, then Data, and choose Export your data. You&apos;ll get a .zip file. Upload it here
          as it is.
        </p>
        <p>
          We bring in watched films, ratings, liked films, your watchlist, diary entries and reviews. Lists, tags and
          comments aren&apos;t imported yet. Running the same import twice won&apos;t create duplicates.
        </p>
      </div>
      <ImportFlow username={viewer.username} />
    </div>
  );
}
