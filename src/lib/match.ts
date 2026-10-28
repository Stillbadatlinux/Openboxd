// Pure title-matching helpers (no server-only imports, so they can be unit-tested).

function yearOf(date?: string | null) {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) && y > 1800 ? y : null;
}

/** Lowercase, strip accents and punctuation, and drop a leading article, so "The School of Rock" ≈ "School of Rock". */
export function normTitle(s: string) {
  return s
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^(the|a|an)\s+/, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Scores a TMDB result against a title + year. Title agreement matters most; the year only breaks ties,
 * because Letterboxd and TMDB often disagree by a year (festival premiere vs. release date).
 */
export function scoreCandidate(
  target: { title: string; year?: number | null },
  r: { title: string; original_title?: string; release_date?: string },
) {
  const want = normTitle(target.title);
  const titles = [r.title, r.original_title].filter(Boolean).map((t) => normTitle(t!));
  const exact = titles.includes(want);
  const partial = !exact && want.length >= 4 && titles.some((t) => t.length >= 4 && (t.includes(want) || want.includes(t)));
  const y = yearOf(r.release_date);
  const gap = target.year && y ? Math.abs(y - target.year) : null;
  const titleScore = exact ? 10 : partial ? 3 : 0;
  // A title match decades away is a different film (remakes, reused titles), so a large gap outweighs it.
  const yearScore = gap === null ? 0 : gap === 0 ? 3 : gap === 1 ? 2 : gap <= 3 ? 0 : -12;
  return { score: titleScore + yearScore, exact, partial, gap };
}
