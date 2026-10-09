import { CHAPTER_STATUS } from "@/lib/catalog";
import type { ChapterProgressStatus } from "@/lib/catalog-types";

export default function ChapterStatusPill({
  status,
}: {
  status: ChapterProgressStatus;
}) {
  const { label, tone } = CHAPTER_STATUS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}
    >
      {label}
    </span>
  );
}
