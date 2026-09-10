import {
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  PlayCircle,
  Sigma,
} from "lucide-react";
import type { LearningResource, LearningResourceType } from "@/lib/diagnostic-types";

export const resourceVisuals: Record<
  LearningResourceType,
  { label: string; icon: typeof PlayCircle; tone: string }
> = {
  VIDEO: {
    label: "Video",
    icon: PlayCircle,
    tone: "bg-violet-100 text-violet-800",
  },
  NOTES: { label: "Notes", icon: FileText, tone: "bg-info-tint text-info" },
  PRACTICE: {
    label: "Practice",
    icon: ClipboardCheck,
    tone: "bg-warning-tint text-warning",
  },
  FORMULA: {
    label: "Formula",
    icon: Sigma,
    tone: "bg-success-tint text-success",
  },
};

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function ResourceCard({
  resource,
}: {
  resource: LearningResource;
}) {
  const visual = resourceVisuals[resource.type];
  const Icon = visual.icon;
  const url = safeExternalUrl(resource.url);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-hairline bg-surface p-5 shadow-[0_8px_22px_rgba(20,20,30,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${visual.tone}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {visual.label}
        </span>
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-ink">
        {resource.title}
      </h3>
      {resource.description && (
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {resource.description}
        </p>
      )}
      {resource.content && (
        <p className="mt-4 rounded-xl bg-canvas p-3 text-sm leading-6 text-ink-soft">
          {resource.content}
        </p>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-primary hover:text-primary-strong"
        >
          Open resource <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </article>
  );
}
