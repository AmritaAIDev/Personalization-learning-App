"use client";

export interface RadarPoint {
  label: string;
  /** 0-100, or null when there is no data for the axis. */
  value: number | null;
}

const CENTER = 120;
const RADIUS = 74;

function pointFor(index: number, count: number, distance: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return {
    x: CENTER + Math.cos(angle) * distance,
    y: CENTER + Math.sin(angle) * distance,
  };
}

/** Shortens long axis labels so they fit around the chart. */
function shorten(label: string): string {
  return label.length > 13 ? `${label.slice(0, 12)}…` : label;
}

/**
 * Small dependency-free radar chart in the app's colour tokens. Axes without
 * data sit at the centre and are listed in the accessible summary, so a
 * missing value is never drawn as a real 0%.
 */
export default function RadarChart({
  points,
  label,
}: {
  points: readonly RadarPoint[];
  label: string;
}) {
  if (points.length < 3) return null;
  const ring = (fraction: number) =>
    points
      .map((_, index) => {
        const p = pointFor(index, points.length, RADIUS * fraction);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  const shape = points
    .map((point, index) => {
      const p = pointFor(
        index,
        points.length,
        RADIUS * ((point.value ?? 0) / 100),
      );
      return `${p.x},${p.y}`;
    })
    .join(" ");
  const summary = points
    .map((point) =>
      point.value === null ? `${point.label}: no data` : `${point.label}: ${point.value}%`,
    )
    .join(", ");

  return (
    <svg
      viewBox="0 0 240 240"
      className="mx-auto w-full max-w-xs"
      role="img"
      aria-label={`${label}. ${summary}`}
    >
      {[1, 0.66, 0.33].map((fraction) => (
        <polygon
          key={fraction}
          points={ring(fraction)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray={fraction === 1 ? undefined : "3 3"}
          className="text-hairline"
        />
      ))}
      {points.map((_, index) => {
        const end = pointFor(index, points.length, RADIUS);
        return (
          <line
            key={index}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke="currentColor"
            strokeWidth="1"
            className="text-hairline"
          />
        );
      })}
      <polygon
        points={shape}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        className="text-primary"
      />
      {points.map((point, index) => {
        const dot = pointFor(
          index,
          points.length,
          RADIUS * ((point.value ?? 0) / 100),
        );
        const text = pointFor(index, points.length, RADIUS + 22);
        return (
          <g key={point.label}>
            {point.value === null ? null : (
              <circle
                cx={dot.x}
                cy={dot.y}
                r="3"
                fill="currentColor"
                className="text-primary"
              />
            )}
            <text
              x={text.x}
              y={text.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-soft text-[9px] font-semibold"
            >
              {shorten(point.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
