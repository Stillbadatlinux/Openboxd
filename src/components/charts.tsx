// Small single-series bar charts drawn with HTML/CSS. One hue (--chart), thin marks,
// 4px rounded data ends, a hover tooltip per bar and a table for screen readers.

type Datum = { label: string; value: number; detail?: string };

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-rule bg-surface px-2 py-1 text-xs text-ink shadow-lg group-hover:block"
    >
      {children}
    </span>
  );
}

function SrTable({ caption, data, unit }: { caption: string; data: Datum[]; unit: string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <tbody>
        {data.map((d) => (
          <tr key={d.label}>
            <th scope="row">{d.label}</th>
            <td>
              {d.value} {unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Vertical bars along a category axis (months, weekdays, ratings). */
export function ColumnChart({
  title,
  data,
  unit,
  height = 140,
}: {
  title: string;
  data: Datum[];
  unit: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);
  return (
    <figure>
      <figcaption className="mb-3 font-semibold">{title}</figcaption>
      <div aria-hidden className="mt-5 flex items-end gap-[2px] border-b border-rule" style={{ height }}>
        {data.map((d) => (
          <span key={d.label} className="group relative flex h-full flex-1 items-end">
            <span
              className="relative mx-auto w-full max-w-8 rounded-t-[4px] bg-chart transition-opacity group-hover:opacity-80"
              style={{ height: d.value ? `${(d.value / max) * 100}%` : 0, minHeight: d.value ? 3 : 0 }}
            >
              {d === peak && d.value > 0 && (
                <span className="absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 text-xs font-semibold text-ink">{d.value}</span>
              )}
            </span>
            <Tip>
              <b>{d.detail ?? d.label}</b> {d.value} {unit}
            </Tip>
          </span>
        ))}
      </div>
      <div aria-hidden className="mt-1 flex gap-[2px] text-center text-[0.7rem] text-muted">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate">
            {d.label}
          </span>
        ))}
      </div>
      <SrTable caption={title} data={data} unit={unit} />
    </figure>
  );
}

/** Ranked horizontal bars with direct labels (genres, directors). */
export function BarList({ title, data, unit }: { title: string; data: Datum[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <figcaption className="mb-3 font-semibold">{title}</figcaption>
      {data.length ? (
        <ul className="grid gap-2">
          {data.map((d) => (
            <li key={d.label} className="grid grid-cols-[minmax(6rem,10rem)_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="truncate" title={d.label}>
                {d.label}
              </span>
              <span className="h-2.5 rounded-r-[4px] bg-chart" style={{ width: `${(d.value / max) * 100}%` }} aria-hidden />
              <span className="text-right tabular-nums text-muted">{d.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Not enough data yet.</p>
      )}
      <SrTable caption={title} data={data} unit={unit} />
    </figure>
  );
}
