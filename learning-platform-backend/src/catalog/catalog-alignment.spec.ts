import { compareAlignment } from './catalog-alignment';

const ch = (subject: string, chapter: string) => ({ subject, chapter });
const counted = (subject: string, chapter: string, count: number) => ({
  subject,
  chapter,
  count,
});

describe('compareAlignment', () => {
  it('reports a fully aligned catalog as clean', () => {
    const report = compareAlignment({
      treeChapters: [ch('Physics', 'Optics'), ch('Physics', 'Waves')],
      questionChapters: [
        counted('Physics', 'Optics', 5),
        counted('Physics', 'Waves', 2),
      ],
      stateChapters: [counted('Physics', 'Optics', 1)],
    });
    expect(report).toEqual({
      aligned: 2,
      emptyTreeChapters: [],
      unmatchedQuestionChapters: [],
      unmatchedStateChapters: [],
    });
  });

  it('finds the Electrostatics-style split when no alias handles it', () => {
    const report = compareAlignment({
      aliases: [],
      treeChapters: [
        ch('Physics', 'Electrostatics'),
        ch('Physics', 'Optics'),
        ch('Chemistry', 'Solutions'),
      ],
      questionChapters: [
        counted('Physics', 'Electric Charges and Fields', 234),
        counted('Physics', 'Optics', 10),
        counted('Chemistry', 'Solutions', 4),
      ],
      stateChapters: [counted('Physics', 'Electric Charges and Fields', 3)],
    });
    expect(report.aligned).toBe(2);
    expect(report.emptyTreeChapters).toEqual([ch('Physics', 'Electrostatics')]);
    expect(report.unmatchedQuestionChapters).toEqual([
      {
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        count: 234,
        aliasedTo: null,
        candidates: ['Electrostatics'],
      },
    ]);
    expect(report.unmatchedStateChapters[0]).toMatchObject({
      chapter: 'Electric Charges and Fields',
      count: 3,
    });
  });

  it('marks mismatches that the built-in chapter aliases already handle', () => {
    const report = compareAlignment({
      treeChapters: [
        ch('Physics', 'Electrostatics'),
        ch('Physics', 'Optics'),
        ch('Chemistry', 'Chemical Thermodynamics'),
      ],
      questionChapters: [
        counted('Physics', 'Electric Charges and Fields', 282),
        counted('Physics', 'Optics', 10),
        counted('Chemistry', 'Thermodynamics', 3),
        counted('Physics', 'Totally Unknown', 2),
      ],
      stateChapters: [counted('Physics', 'Electric Charges and Fields', 30)],
    });
    // content folded onto Electrostatics means it is no longer empty
    expect(report.emptyTreeChapters).toEqual([]);
    expect(report.aligned).toBe(3);
    const byChapter = Object.fromEntries(
      report.unmatchedQuestionChapters.map((c) => [c.chapter, c.aliasedTo]),
    );
    expect(byChapter).toEqual({
      'Electric Charges and Fields': 'Electrostatics',
      Thermodynamics: 'Chemical Thermodynamics',
      'Totally Unknown': null, // still needs a human decision
    });
    expect(report.unmatchedStateChapters[0].aliasedTo).toBe('Electrostatics');
  });

  it('only suggests empty chapters of the same subject, best name match first', () => {
    const report = compareAlignment({
      treeChapters: [
        ch('Chemistry', 'Electrochemistry'),
        ch('Physics', 'Current Electricity'),
        ch('Physics', 'Electrostatic Potential'),
        ch('Physics', 'Waves'),
      ],
      questionChapters: [
        counted('Physics', 'Electrostatic Potential and Capacitance', 9),
      ],
      stateChapters: [],
    });
    const [only] = report.unmatchedQuestionChapters;
    // shared words rank first; ties fall back to alphabetical order; a
    // chapter from another subject is never offered
    expect(only.candidates).toEqual([
      'Electrostatic Potential',
      'Current Electricity',
      'Waves',
    ]);
  });

  it('treats a subject mismatch as a different chapter', () => {
    const report = compareAlignment({
      treeChapters: [ch('Physics', 'Solutions')],
      questionChapters: [counted('Chemistry', 'Solutions', 3)],
      stateChapters: [],
    });
    expect(report.aligned).toBe(0);
    expect(report.emptyTreeChapters).toEqual([ch('Physics', 'Solutions')]);
    expect(report.unmatchedQuestionChapters).toHaveLength(1);
  });

  it('lists the biggest unmatched tags first', () => {
    const report = compareAlignment({
      treeChapters: [],
      questionChapters: [
        counted('Physics', 'A', 1),
        counted('Physics', 'B', 9),
      ],
      stateChapters: [],
    });
    expect(report.unmatchedQuestionChapters.map((c) => c.chapter)).toEqual([
      'B',
      'A',
    ]);
  });
});
