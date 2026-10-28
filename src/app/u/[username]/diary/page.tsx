import type { Metadata } from "next";
import Link from "next/link";
import { displayName } from "@/components/avatar";
import { DiaryRow, EmptyState } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";
import { entryInclude, type EntryWithMeta } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

const PER_PAGE = 50;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `${displayName(p)}'s diary` };
}

export default async function DiaryTab({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ year?: string; page?: string }>;
}) {
  const profile = await getProfile((await params).username);
  const viewer = await getViewer();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const year = Number(sp.year) || null;

  const years = await db.$queryRaw<{ y: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM "watchedOn")::int AS y FROM "LogEntry"
    WHERE "userId" = ${profile.id} AND "watchedOn" IS NOT NULL ORDER BY y DESC`;

  const entries = await db.logEntry.findMany({
    where: {
      userId: profile.id,
      ...(year ? { watchedOn: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } } : {}),
    },
    include: entryInclude,
    orderBy: [{ watchedOn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE + 1,
  });
  const shown = entries.slice(0, PER_PAGE);

  // Group rows under month headings.
  const groups: { label: string; rows: EntryWithMeta[] }[] = [];
  for (const e of shown) {
    const label = e.watchedOn
      ? e.watchedOn.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
      : "Undated";
    if (groups.at(-1)?.label !== label) groups.push({ label, rows: [] });
    groups.at(-1)!.rows.push(e);
  }
  const base = `/u/${profile.username}/diary`;

  return (
    <div className="max-w-3xl">
      {years.length > 1 && (
        <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Filter by year">
          <Link href={base} aria-current={!year ? "page" : undefined} className={`rounded-full border px-3 py-1 ${!year ? "border-ink font-semibold" : "border-rule text-muted hover:text-ink"}`}>
            All years
          </Link>
          {years.map(({ y }) => (
            <Link
              key={y}
              href={`${base}?year=${y}`}
              aria-current={y === year ? "page" : undefined}
              className={`rounded-full border px-3 py-1 ${y === year ? "border-ink font-semibold" : "border-rule text-muted hover:text-ink"}`}
            >
              {y}
            </Link>
          ))}
        </nav>
      )}
      {groups.length ? (
        groups.map((g) => (
          <section key={g.label} className="mb-8">
            <h2 className="display mb-3 text-xl text-muted">{g.label}</h2>
            <ol className="grid gap-3">
              {g.rows.map((e) => (
                <DiaryRow key={e.id} entry={e} editable={viewer?.id === profile.id} />
              ))}
            </ol>
          </section>
        ))
      ) : (
        <EmptyState title={year ? `Nothing logged in ${year}` : "No diary entries yet"} />
      )}
      <Pagination
        page={page}
        hasMore={entries.length > PER_PAGE}
        href={(p) => `${base}?${new URLSearchParams({ ...(year ? { year: String(year) } : {}), page: String(p) })}`}
        prevLabel="Later"
        nextLabel="Earlier"
      />
    </div>
  );
}
