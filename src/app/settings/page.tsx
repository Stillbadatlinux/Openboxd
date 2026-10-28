import type { Metadata } from "next";
import Link from "next/link";
import { FavoritesPicker, PasswordForm, ProfileForm } from "@/components/settings-forms";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireViewer("/settings");
  const user = await db.user.findUniqueOrThrow({ where: { id: viewer.id } });
  const favFilms = await db.film.findMany({ where: { id: { in: user.favoriteFilmIds } } });
  const favorites = user.favoriteFilmIds
    .map((id) => favFilms.find((f) => f.id === id))
    .filter((f) => f !== undefined)
    .map((f) => ({ id: f.id, title: f.title, year: f.year, posterPath: f.posterPath }));

  return (
    <div className="wrap max-w-3xl py-10">
      <h1 className="display mb-8 text-4xl">Settings</h1>
      <section className="mb-12">
        <h2 className="section-title">Profile</h2>
        <ProfileForm profile={user} />
      </section>
      <section id="favourites" className="mb-12 scroll-mt-6">
        <h2 className="section-title">Favourite films</h2>
        <p className="mb-4 text-sm text-muted">Up to four, shown at the top of your profile in this order.</p>
        <FavoritesPicker initial={favorites} />
      </section>
      <section className="mb-12">
        <h2 className="section-title">Import</h2>
        <p className="mb-3 text-muted">Bring over your diary, ratings, reviews and watchlist from a Letterboxd export.</p>
        <Link href="/settings/import" className="btn btn-quiet">
          Import from Letterboxd
        </Link>
      </section>
      <section>
        <h2 className="section-title">Password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
