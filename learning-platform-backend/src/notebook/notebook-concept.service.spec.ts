import { ConfigService } from '@nestjs/config';
import { NotebookConceptService } from './notebook-concept.service';
import type { NotebookMistakeCard } from './notebook.types';

function makeCard(topic: string, misconception: string): NotebookMistakeCard {
  return {
    id: `id-${topic}-${misconception}`,
    source: 'PRACTICE',
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic,
    questionId: `q-${topic}`,
    questionText: `${topic} question`,
    selectedOption: 'A',
    correctOption: 'B',
    solution: 'Solution',
    misconception,
    conceptTags: ['flux'],
    difficulty: 'Easy',
    bloomLevel: 'Remember',
    occurredAt: '2026-07-20T10:00:00.000Z',
    dueReviewAt: '2026-07-21T10:00:00.000Z',
    reviewState: 'DUE',
    practiceSimilar: { subject: 'Physics', chapter: 'Electrostatics', topic },
  };
}

function makeConfig(apiKey: string | undefined): ConfigService {
  return {
    get: jest.fn((key: string) =>
      key === 'DEEPSEEK_API_KEY' ? apiKey : undefined,
    ),
  } as never;
}

describe('NotebookConceptService', () => {
  it('falls back to the topic label and first misconception without an API key', async () => {
    const service = new NotebookConceptService(makeConfig(undefined));
    const result = await service.summariseGroup({
      topic: 'Gauss Law',
      chapter: 'Electrostatics',
      subject: 'Physics',
      cards: [
        makeCard('Gauss Law', 'Flux depends on outside charge.'),
        makeCard('Gauss Law', 'Confusing field with flux.'),
      ],
    });
    expect(result.source).toBe('FALLBACK');
    expect(result.conceptLabel).toBe('Gauss Law');
    expect(result.misconceptionSummary).toBe('Flux depends on outside charge.');
  });

  it('falls back for a singleton group even when the model is configured', async () => {
    const service = new NotebookConceptService(makeConfig('sk-test'));
    const result = await service.summariseGroup({
      topic: 'Gauss Law',
      chapter: 'Electrostatics',
      subject: 'Physics',
      cards: [makeCard('Gauss Law', 'Only one mistake here.')],
    });
    expect(result.source).toBe('FALLBACK');
    expect(result.conceptLabel).toBe('Gauss Law');
  });

  it('produces a deterministic summary when no misconception text is present', async () => {
    const service = new NotebookConceptService(makeConfig(undefined));
    const card = makeCard('Gauss Law', '');
    const result = await service.summariseGroup({
      topic: 'Gauss Law',
      chapter: 'Electrostatics',
      subject: 'Physics',
      cards: [card, card],
    });
    expect(result.source).toBe('FALLBACK');
    expect(result.misconceptionSummary).toContain('Gauss Law');
  });
});
