import { describe, expect, it } from 'vitest';
import { parseTutorMarkdown } from './tutor-markdown';

describe('tutor markdown parser', () => {
  it('keeps tutor sections, bullets, numbered steps, and inline emphasis structured', () => {
    expect(
      parseTutorMarkdown(
        [
          '### What to correct',
          'Use **Gauss law** only with a useful symmetry.',
          '',
          '- Check the surface',
          '- Compare `E` on each point',
          '',
          '1. Identify symmetry',
          '2. Choose the Gaussian surface',
        ].join('\n'),
      ),
    ).toMatchObject([
      { type: 'heading', text: 'What to correct' },
      {
        type: 'paragraph',
        segments: [
          { type: 'text', text: 'Use ' },
          { type: 'strong', text: 'Gauss law' },
          { type: 'text', text: ' only with a useful symmetry.' },
        ],
      },
      {
        type: 'unorderedList',
        items: [
          [{ type: 'text', text: 'Check the surface' }],
          [
            { type: 'text', text: 'Compare ' },
            { type: 'code', text: 'E' },
            { type: 'text', text: ' on each point' },
          ],
        ],
      },
      {
        type: 'orderedList',
        items: [
          [{ type: 'text', text: 'Identify symmetry' }],
          [{ type: 'text', text: 'Choose the Gaussian surface' }],
        ],
      },
    ]);
  });
});
