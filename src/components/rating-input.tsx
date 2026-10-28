"use client";

import { useState } from "react";
import { ratingLabel } from "@/lib/format";

/**
 * Five stars with half-star precision. Value is 0 (unrated) to 10.
 * Click a star's left half for a half star; click the current rating again to clear it.
 * Keyboard: arrow keys move by half a star, Delete or 0 clears.
 */
export function RatingInput({
  value,
  onChange,
  name,
  size = 28,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  name?: string;
  size?: number;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  function set(v: number) {
    if (disabled) return;
    onChange(v === value ? 0 : v);
  }

  return (
    <div className="flex items-center gap-2">
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Rating"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={value / 2}
        aria-valuetext={ratingLabel(value)}
        aria-disabled={disabled}
        className="flex rounded-sm"
        onMouseLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(10, value + 1));
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(0, value - 1));
          else if (e.key === "Delete" || e.key === "Backspace" || e.key === "0") onChange(0);
          else if (/^[1-5]$/.test(e.key)) onChange(Number(e.key) * 2);
          else return;
          e.preventDefault();
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(2, shown - i * 2)); // 0, 1 (half) or 2 (full)
          return (
            <span
              key={i}
              className="relative cursor-pointer select-none"
              style={{ width: size, height: size }}
              onMouseMove={(e) => {
                if (disabled) return;
                const r = e.currentTarget.getBoundingClientRect();
                setHover(i * 2 + (e.clientX - r.left < r.width / 2 ? 1 : 2));
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                set(i * 2 + (e.clientX - r.left < r.width / 2 ? 1 : 2));
              }}
            >
              <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="absolute inset-0">
                <defs>
                  <clipPath id={`half-${i}`}>
                    <rect x="0" y="0" width="12" height="24" />
                  </clipPath>
                </defs>
                <path d={STAR} fill="none" stroke="var(--muted)" strokeOpacity="0.55" strokeWidth="1.5" />
                {fill > 0 && (
                  <path d={STAR} fill="var(--brass)" clipPath={fill === 1 ? `url(#half-${i})` : undefined} />
                )}
              </svg>
            </span>
          );
        })}
      </div>
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

const STAR =
  "M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z";
