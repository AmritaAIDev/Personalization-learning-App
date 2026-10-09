"use client";

/**
 * Compact completion ring. `value` is a 0-100 percentage, or null when there
 * is nothing to show yet (renders an empty track and an em dash).
 */
export default function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  label,
  tone = "text-primary",
  trackTone = "text-hairline",
  valueTone = "text-ink",
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  /** Accessible description, e.g. "Chapter score". */
  label: string;
  tone?: string;
  trackTone?: string;
  valueTone?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const bounded = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference - (bounded / 100) * circumference;

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={value === null ? `${label}: not available yet` : `${label}: ${bounded}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className={trackTone}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${tone} transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none`}
        />
      </svg>
      <span
        className={`absolute font-heading text-xs font-bold ${valueTone}`}
        aria-hidden="true"
      >
        {value === null ? "—" : `${bounded}%`}
      </span>
    </div>
  );
}
