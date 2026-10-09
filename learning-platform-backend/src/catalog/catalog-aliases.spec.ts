import { CHAPTER_UNITS } from '../scripts/content/compass-chapter-map';
import { buildAliasResolver, CHAPTER_ALIASES } from './catalog-aliases';

const tree = (...pairs: Array<[string, string]>) =>
  pairs.map(([subject, chapter]) => ({ subject, chapter }));

describe('buildAliasResolver', () => {
  const resolver = buildAliasResolver(
    tree(
      ['Physics', 'Electrostatics'],
      ['Physics', 'Optics'],
      ['Chemistry', 'Chemical Thermodynamics'],
    ),
  );

  it('folds the known content-side names onto their tree chapter', () => {
    expect(resolver.canonical('Physics', 'Electric Charges and Fields')).toBe(
      'Electrostatics',
    );
    expect(
      resolver.canonical('Physics', 'Electrostatic Potential and Capacitance'),
    ).toBe('Electrostatics');
    expect(resolver.canonical('Chemistry', 'Thermodynamics')).toBe(
      'Chemical Thermodynamics',
    );
  });

  it('leaves everything else alone', () => {
    expect(resolver.canonical('Physics', 'Optics')).toBe('Optics');
    expect(resolver.canonical('Physics', 'Unknown')).toBe('Unknown');
  });

  it('is scoped to the subject: Physics Thermodynamics is not touched', () => {
    expect(resolver.canonical('Physics', 'Thermodynamics')).toBe(
      'Thermodynamics',
    );
  });

  it('lists the content-side names that fold into a chapter, itself first', () => {
    expect(resolver.sources('Physics', 'Electrostatics')).toEqual([
      'Electrostatics',
      'Electric Charges and Fields',
      'Electrostatic Potential and Capacitance',
    ]);
    expect(resolver.sources('Physics', 'Optics')).toEqual(['Optics']);
  });

  it('resolves an alias URL slug (e.g. from a workspace breadcrumb) to the tree chapter', () => {
    expect(
      resolver.chapterForSlug('Physics', 'electric-charges-and-fields'),
    ).toBe('Electrostatics');
    expect(
      resolver.chapterForSlug('Physics', 'ELECTRIC-CHARGES-AND-FIELDS'),
    ).toBe('Electrostatics');
    expect(resolver.chapterForSlug('Physics', 'optics')).toBeNull();
    expect(
      resolver.chapterForSlug('Chemistry', 'electric-charges-and-fields'),
    ).toBeNull();
  });

  it('switches an alias off once the tree has a real chapter of that name', () => {
    const both = buildAliasResolver(
      tree(
        ['Physics', 'Electrostatics'],
        ['Physics', 'Electric Charges and Fields'],
      ),
    );
    // the real chapter keeps its own content...
    expect(both.canonical('Physics', 'Electric Charges and Fields')).toBe(
      'Electric Charges and Fields',
    );
    // ...and Electrostatics only absorbs the alias that is still unmatched
    expect(both.sources('Physics', 'Electrostatics')).toEqual([
      'Electrostatics',
      'Electrostatic Potential and Capacitance',
    ]);
  });

  it('ignores an alias whose target is not in the tree', () => {
    const none = buildAliasResolver(tree(['Physics', 'Optics']));
    expect(none.canonical('Physics', 'Electric Charges and Fields')).toBe(
      'Electric Charges and Fields',
    );
    expect(none.forSubject('Physics')).toEqual([]);
  });
});

describe('CHAPTER_ALIASES', () => {
  it('only point at real syllabus chapters, never at themselves', () => {
    for (const alias of CHAPTER_ALIASES) {
      expect(alias.from).not.toBe(alias.to);
      expect(Object.keys(CHAPTER_UNITS)).toContain(
        `${alias.subject}|${alias.to}`,
      );
    }
  });

  it('never alias a name that is itself a syllabus chapter', () => {
    for (const alias of CHAPTER_ALIASES) {
      expect(Object.keys(CHAPTER_UNITS)).not.toContain(
        `${alias.subject}|${alias.from}`,
      );
    }
  });
});
