import { toCitations } from './citation.util';
import type { RetrievedSource } from './agent/agent.service';

function source(title: string, snippet = 'body'): RetrievedSource {
  return { title, topic: 'Gauss Law', chapter: 'Electric Fields', snippet };
}

describe('toCitations', () => {
  it('strips the raw snippet and keeps only the label fields', () => {
    const [citation] = toCitations([source('Gauss’s Law', 'secret body text')]);
    expect(citation).toEqual({
      title: 'Gauss’s Law',
      topic: 'Gauss Law',
      chapter: 'Electric Fields',
    });
    expect(JSON.stringify(citation)).not.toContain('secret body text');
  });

  it('de-duplicates by title case-insensitively', () => {
    const citations = toCitations([
      source('Gauss’s Law'),
      source('gauss’s law'),
      source('Electric Flux'),
    ]);
    expect(citations).toHaveLength(2);
  });

  it('caps the list at three', () => {
    const citations = toCitations([
      source('A'),
      source('B'),
      source('C'),
      source('D'),
    ]);
    expect(citations).toHaveLength(3);
  });

  it('skips sources with an empty title', () => {
    expect(toCitations([source('')])).toHaveLength(0);
  });

  it('returns an empty list for no sources', () => {
    expect(toCitations([])).toEqual([]);
  });
});
