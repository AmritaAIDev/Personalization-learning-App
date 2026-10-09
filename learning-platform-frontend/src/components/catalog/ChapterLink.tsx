import Link from "next/link";
import { chapterHrefByName, subjectHref, slugify } from "@/lib/catalog";

/**
 * "Subject · Chapter" text where both parts open the matching catalog page.
 * Drop-in for the plain strings shown on cards across the app.
 */
export default function ChapterLink({
  subject,
  chapter,
  topic,
  className = "",
}: {
  subject: string;
  chapter: string;
  /** Appended as plain text (topics have no catalog page of their own). */
  topic?: string;
  className?: string;
}) {
  const linkClass =
    "rounded font-medium underline-offset-2 hover:text-primary hover:underline";
  return (
    <span className={className}>
      <Link href={subjectHref(slugify(subject))} className={linkClass}>
        {subject}
      </Link>
      {" · "}
      <Link href={chapterHrefByName(subject, chapter)} className={linkClass}>
        {chapter}
      </Link>
      {topic ? <> · {topic}</> : null}
    </span>
  );
}
