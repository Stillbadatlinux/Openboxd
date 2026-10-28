import { plural } from "@/lib/format";

/** Distribution of half-star ratings, ½★ on the left to ★★★★★ on the right. */
export function RatingHistogram({ histogram, average }: { histogram: number[]; average: number | null }) {
  const max = Math.max(1, ...histogram);
  const total = histogram.reduce((a, b) => a + b, 0);
  return (
    <figure>
      <div className="flex items-end justify-between gap-3">
        <figcaption className="text-sm text-muted">{plural(total, "rating")}</figcaption>
        {average !== null && (
          <span className="display text-3xl" title="Average rating out of 5">
            {average.toFixed(1)}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end gap-[3px]" style={{ height: 56 }}>
        <span className="mr-1 self-end text-xs text-brass" aria-hidden>★</span>
        {histogram.map((n, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-[2px] bg-chart"
            style={{ height: `${Math.max(3, (n / max) * 100)}%`, opacity: n ? 1 : 0.25 }}
            title={`${(i + 1) / 2} stars: ${plural(n, "rating")}`}
          />
        ))}
        <span className="ml-1 self-end whitespace-nowrap text-xs text-brass" aria-hidden>★★★★★</span>
      </div>
    </figure>
  );
}
