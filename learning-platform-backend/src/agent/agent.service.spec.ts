import { AgentService, type ExplanationDepth } from './agent.service';

/**
 * The depth toggle only shapes prompt wording, so it is verified directly on
 * the pure directive builder without touching the external model.
 */
describe('AgentService depth directive', () => {
  // Values that keep the OpenAI/Qdrant clients constructible; no network call
  // is made because only the pure directive builder is exercised.
  const configService = {
    get: jest.fn((key: string) =>
      key === 'QDRANT_URL' ? 'http://localhost:6333' : 'test-key',
    ),
  };
  const embeddingService = {};
  const topicsRepository = {};
  let service: AgentService;
  let directiveFor: (depth: ExplanationDepth | undefined) => string;

  beforeEach(() => {
    service = new AgentService(
      configService as never,
      embeddingService as never,
      topicsRepository as never,
    );
    directiveFor = (depth) =>
      (
        service as unknown as {
          depthDirective: (d: ExplanationDepth | undefined) => string;
        }
      ).depthDirective(depth);
  });

  it('returns an empty directive for the default (undefined) depth', () => {
    expect(directiveFor(undefined)).toBe('');
  });

  it('asks for brevity on the concise depth', () => {
    expect(directiveFor('concise').toLowerCase()).toContain('concise');
  });

  it('asks for numbered reasoning on the step-by-step depth', () => {
    expect(directiveFor('step-by-step').toLowerCase()).toContain('step');
  });

  it('asks for first-principles build-up on the from-scratch depth', () => {
    expect(directiveFor('from-scratch').toLowerCase()).toContain(
      'first principles',
    );
  });
});

describe('AgentService source retrieval (RAG citations)', () => {
  const configService = {
    get: jest.fn((key: string) =>
      key === 'QDRANT_URL' ? 'http://localhost:6333' : 'test-key',
    ),
  };
  const embeddingService = { embed: jest.fn() };
  const topicsRepository = {};
  let service: AgentService;

  function build(): AgentService {
    return new AgentService(
      configService as never,
      embeddingService as never,
      topicsRepository as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = build();
    embeddingService.embed.mockResolvedValue([0.1, 0.2, 0.3]);
  });

  it('maps Qdrant payloads to structured sources and drops empty snippets', async () => {
    const search = jest.fn().mockResolvedValue([
      {
        payload: {
          title: 'Gauss’s Law',
          topic: 'Gauss Law',
          chapter: 'Electric Fields',
          text: 'Flux through a closed surface…',
        },
      },
      { payload: { title: 'No body', topic: 't', chapter: 'c' } },
    ]);
    (service as unknown as { qdrantClient: { search: jest.Mock } }).qdrantClient =
      { search } as never;

    const sources = await service.retrieveSourcesFromQdrant('Gauss Law');

    expect(sources).toEqual([
      {
        title: 'Gauss’s Law',
        topic: 'Gauss Law',
        chapter: 'Electric Fields',
        snippet: 'Flux through a closed surface…',
      },
    ]);
  });

  it('degrades to an empty citation list when retrieval fails (never blocks)', async () => {
    const search = jest.fn().mockRejectedValue(new Error('qdrant down'));
    (service as unknown as { qdrantClient: { search: jest.Mock } }).qdrantClient =
      { search } as never;

    const sources = await service.retrieveSupplementalSources('Gauss Law');

    expect(sources).toEqual([]);
    // Second call within the negative-cache window must not re-hit the store.
    await service.retrieveSupplementalSources('Gauss Law');
    expect(search).toHaveBeenCalledTimes(1);
  });
});
