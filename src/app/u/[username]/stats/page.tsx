import type { Metadata } from "next";
import Link from "next/link";
import { displayName } from "@/components/avatar";
import { BarList, ColumnChart } from "@/components/charts";
import { EmptyState } from "@/components/cards";
import { Poster } from "@/components/poster";
import { Stars } from "@/components/stars";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `${displayName(p)}'s stats` };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function topCounts(values: string[], n = 8) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

export default async function StatsTab({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const profile = await getProfile((await params).username);
  const years = (
    await db.$queryRaw<{ y: number }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM "watchedOn")::int AS y FROM "LogEntry"
      WHERE "userId" = ${profile.id} AND "watchedOn" IS NOT NULL ORDER BY y DESC`
  ).map((r) => r.y);
  const yearParam = (await searchParams).year;
  const allTime = yearParam === "all";
  const year = allTime ? null : Number(yearParam) || years[0] || new Date().getUTCFullYear();
  const base = `/u/${profile.username}/stats`;

  const entries = await db.logEntry.findMany({
    where: {
      userId: profile.id,
      watchedOn: year ? { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } : { not: null },
    },
    include: { film: true },
    orderBy: { watchedOn: "asc" },
  });

  const yearNav = (
    <nav className="mb-8 flex flex-wrap gap-2 text-sm" aria-label="Choose a year">
      {years.map((y) => (
        <Link
          key={y}
          href={`${base}?year=${y}`}
          aria-current={y === year ? "page" : undefined}
          className={`rounded-full border px-3 py-1 ${y === year ? "border-ink font-semibold" : "border-rule text-muted hover:text-ink"}`}
        >
          {y}
        </Link>
      ))}
      {years.length > 1 && (
        <Link
          href={`${base}?year=all`}
          aria-current={allTime ? "page" : undefined}
          className={`rounded-full border px-3 py-1 ${allTime ? "border-ink font-semibold" : "border-rule text-muted hover:text-ink"}`}
        >
          All time
        </Link>
      )}
    </nav>
  );

  if (!entries.length) {
    return (
      <>
        {yearNav}
        <EmptyState title={year ? `No dated diary entries in ${year}` : "No dated diary entries yet"}>
          Stats are built from diary entries with a watched date.
        </EmptyState>
      </>
    );
  }

  const minutes = entries.reduce((m, e) => m + (e.film.runtime ?? 0), 0);
  const uniqueFilms = new Set(entries.map((e) => e.filmId)).size;
  const reviews = entries.filter((e) => e.review).length;
  const rewatches = entries.filter((e) => e.rewatch).length;
  const rated = entries.filter((e) => e.rating);
  const avg = rated.length ? rated.reduce((s, e) => s + e.rating!, 0) / rated.length / 2 : null;

  const byMonth = MONTHS.map((label, i) => ({
    label,
    value: entries.filter((e) => e.watchedOn!.getUTCMonth() === i).length,
  }));
  const byDay = DAYS.map((label, i) => ({
    label,
    value: entries.filter((e) => (e.watchedOn!.getUTCDay() + 6) % 7 === i).length,
  }));
  const byRating = Array.from({ length: 10 }, (_, i) => ({
    label: (i + 1) % 2 ? `${Math.floor((i + 1) / 2) || ""}½` : String((i + 1) / 2),
    detail: `${(i + 1) / 2} stars:`,
    value: rated.filter((e) => e.rating === i + 1).length,
  }));
  const decades = topCounts(
    entries.filter((e) => e.film.year).map((e) => `${Math.floor(e.film.year! / 10) * 10}s`),
    10,
  ).sort((a, b) => a.label.localeCompare(b.label));

  const best = [...rated]
    .sort((a, b) => b.rating! - a.rating! || +b.watchedOn! - +a.watchedOn!)
    .filter((e, i, arr) => arr.findIndex((x) => x.filmId === e.filmId) === i)
    .slice(0, 10);

  const headline: [string, string][] = [
    [entries.length.toLocaleString("en-GB"), entries.length === 1 ? "film logged" : "films logged"],
    [Math.round(minutes / 60).toLocaleString("en-GB"), "hours watched"],
    [uniqueFilms.toLocaleString("en-GB"), "different films"],
    [reviews.toLocaleString("en-GB"), reviews === 1 ? "review" : "reviews"],
    [rewatches.toLocaleString("en-GB"), rewatches === 1 ? "rewatch" : "rewatches"],
    [avg !== null ? avg.toFixed(1) : "—", "average rating"],
  ];

  return (
    <>
      {yearNav}
      <h2 className="display mb-6 text-4xl sm:text-5xl">{year ? `${year} in film` : "All time"}</h2>
      <ul className="mb-12 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {headline.map(([n, label]) => (
          <li key={label} className="border-t-2 border-velvet pt-2 dark:border-brass">
            <span className="display block text-4xl font-semibold leading-none">{n}</span>
            <span className="mt-1 block text-sm text-muted">{label}</span>
          </li>
        ))}
      </ul>

      <div className="grid gap-12 lg:grid-cols-2">
        {year ? (
          <ColumnChart title="Films by month" data={byMonth} unit="films" />
        ) : (
          <ColumnChart title="Films by release decade" data={decades} unit="films" />
        )}
        <ColumnChart title="Films by day of the week" data={byDay} unit="films" />
        <ColumnChart title="Ratings given" data={byRating} unit="ratings" />
        <BarList title="Top genres" data={topCounts(entries.flatMap((e) => e.film.genres))} unit="films" />
        <BarList title="Most-watched directors" data={topCounts(entries.flatMap((e) => e.film.directors))} unit="films" />
        {year && decades.length > 0 && <BarList title="Release decades" data={decades} unit="films" />}
      </div>

      {best.length > 0 && (
        <section className="mt-14">
          <h3 className="section-title">Highest rated</h3>
          <ol className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-10">
            {best.map((e) => (
              <li key={e.id}>
                <Poster film={e.film} />
                <Stars rating={e.rating} className="mt-1 block text-xs" />
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
