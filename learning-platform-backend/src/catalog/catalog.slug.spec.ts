import { CHAPTER_UNITS } from '../scripts/content/compass-chapter-map';
import { findBySlug, slugify } from './catalog.slug';

describe('catalog slugs', () => {
  it.each([
    ['Physics', 'physics'],
    ['d- and f-Block Elements', 'd-and-f-block-elements'],
    ['p-Block Elements', 'p-block-elements'],
    ['Work, Energy and Power', 'work-energy-and-power'],
    ['Raoult’s Law & Ideal Solutions', 'raoults-law-and-ideal-solutions'],
    ['  Sets, Relations and Functions  ', 'sets-relations-and-functions'],
  ])('slugifies %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('is idempotent', () => {
    const once = slugify('Alcohols, Phenols and Ethers');
    expect(slugify(once)).toBe(once);
  });

  it('finds by slug case-insensitively', () => {
    const items = [{ name: 'Optics' }, { name: 'Waves' }];
    expect(findBySlug(items, 'OPTICS')).toBe(items[0]);
    expect(findBySlug(items, 'missing')).toBeUndefined();
  });

  it('gives every syllabus chapter a unique slug within its subject', () => {
    const seen = new Set<string>();
    for (const key of Object.keys(CHAPTER_UNITS)) {
      const [subject, chapter] = key.split('|');
      const slug = `${slugify(subject)}/${slugify(chapter)}`;
      expect(seen.has(slug)).toBe(false);
      seen.add(slug);
      expect(slug).toMatch(/^[a-z]+\/[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    expect(seen.size).toBe(55);
  });
});
