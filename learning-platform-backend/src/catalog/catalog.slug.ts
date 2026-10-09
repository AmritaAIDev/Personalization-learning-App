/**
 * URL slug for a subject or chapter name, e.g.
 * "d- and f-Block Elements" -> "d-and-f-block-elements",
 * "Work, Energy and Power" -> "work-energy-and-power".
 * Deterministic and case-insensitive, so a stale or differently-cased link
 * still resolves to the same chapter.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/** Finds the item whose name slugifies to `slug` (case-insensitive). */
export function findBySlug<T extends { name: string }>(
  items: readonly T[],
  slug: string,
): T | undefined {
  const wanted = slugify(slug);
  return items.find((item) => slugify(item.name) === wanted);
}
