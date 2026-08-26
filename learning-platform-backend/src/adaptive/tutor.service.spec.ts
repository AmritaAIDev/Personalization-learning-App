import { Repository } from 'typeorm';
import { AgentService } from '../agent/agent.service';
import { LearningQuestionReference } from './adaptive-content.service';
import { LearningQuestionSource } from './adaptive.types';
import { LearningSession } from './learning-session.entity';
import { TutorConversation } from './tutor-conversation.entity';
import { TutorMessage } from './tutor-message.entity';
import { TutorService } from './tutor.service';

describe('TutorService answer-reveal boundary', () => {
  it('replaces a first-attempt response that states the stored answer', async () => {
    const generateTutorResponse = jest.fn(
      async () => 'The correct answer is Coulomb.',
    );
    const agent = {
      generateTutorResponse,
    } as unknown as AgentService;
    const messages = {
      find: jest.fn(async () => []),
      create: jest.fn((value: Partial<TutorMessage>) => value as TutorMessage),
      save: jest.fn(async (value: Partial<TutorMessage>) => ({
        id: 'message-id',
        createdAt: new Date(),
        ...value,
      })),
    } as unknown as Repository<TutorMessage>;
    const conversations = {
      findOne: jest.fn(async () => ({ id: 'conversation-id' })),
    } as unknown as Repository<TutorConversation>;
    const service = new TutorService(agent, conversations, messages);
    const question: LearningQuestionReference = {
      source: LearningQuestionSource.CURATED,
      id: 'question-id',
      questionText: 'What is the SI unit of electric charge?',
      options: ['Ampere', 'Coulomb', 'Volt', 'Farad'],
      correctAnswer: 'Coulomb',
      solution: 'Electric charge is measured in coulombs.',
      hint: 'Identify the physical quantity whose SI unit is requested.',
      conceptTags: ['units'],
      commonErrors: [],
      bloomLevel: 'Remember',
      difficulty: 'Easy',
    };
    const session = {
      id: 'session-id',
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
      topic: "Coulomb's Law and Charge",
    } as LearningSession;

    const message = await service.createSocraticHint(
      'user-id',
      session,
      'session-item-id',
      question,
      'Volt',
    );

    expect(generateTutorResponse).toHaveBeenCalledWith(
      expect.objectContaining({ answerRevealed: false }),
    );
    const tutorPrompt = (
      generateTutorResponse.mock.calls as unknown[][]
    )[0]?.[0] as {
      correctAnswer?: string;
    };
    expect(tutorPrompt.correctAnswer).toBeUndefined();
    expect(message.content).toContain('### Try this next');
    expect(message.content).not.toContain('Coulomb');
  });
});

describe('TutorService background reply state', () => {
  function createService(generateTutorResponse: jest.Mock): {
    service: TutorService;
    session: LearningSession;
  } {
    const agent = { generateTutorResponse } as unknown as AgentService;
    const messages = {
      find: jest.fn(async () => []),
      create: jest.fn((value: Partial<TutorMessage>) => value as TutorMessage),
      save: jest.fn(async (value: Partial<TutorMessage>) => ({
        id: 'message-id',
        createdAt: new Date(),
        ...value,
      })),
    } as unknown as Repository<TutorMessage>;
    const conversations = {
      findOne: jest.fn(async () => ({ id: 'conversation-id' })),
    } as unknown as Repository<TutorConversation>;
    return {
      service: new TutorService(agent, conversations, messages),
      session: {
        id: 'session-id',
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: "Coulomb's Law and Charge",
      } as LearningSession,
    };
  }

  const question: LearningQuestionReference = {
    source: LearningQuestionSource.CURATED,
    id: 'question-id',
    questionText: 'What is the SI unit of electric charge?',
    options: ['Ampere', 'Coulomb', 'Volt', 'Farad'],
    correctAnswer: 'Coulomb',
    solution: 'Electric charge is measured in coulombs.',
    hint: 'Identify the physical quantity whose SI unit is requested.',
    conceptTags: ['units'],
    commonErrors: ['Confusing current with charge'],
    bloomLevel: 'Remember',
    difficulty: 'Easy',
  };

  it('reports a pending reply to the conversation view, then clears it', async () => {
    const { service, session } = createService(
      jest.fn(async () => 'Consider what the unit measures.'),
    );

    service.markPending(session.id);
    expect(service.isPending(session.id)).toBe(true);
    const whileWriting = await service.getConversationMessages(
      'user-id',
      session,
    );
    expect(whileWriting.pending).toBe(true);

    await service.createSocraticHint(
      'user-id',
      session,
      'session-item-id',
      question,
      'Volt',
    );

    expect(service.isPending(session.id)).toBe(false);
    const afterWriting = await service.getConversationMessages(
      'user-id',
      session,
    );
    expect(afterWriting.pending).toBe(false);
  });

  it('clears the pending flag even when the model call fails', async () => {
    const { service, session } = createService(
      jest.fn(async () => {
        throw new Error('model unavailable');
      }),
    );

    service.markPending(session.id);
    const message = await service.createAnswerExplanation(
      'user-id',
      session,
      'session-item-id',
      question,
      'Volt',
    );

    // The database-backed fallback still teaches, and the UI stops waiting.
    expect(message.content).toContain('Coulomb');
    expect(service.isPending(session.id)).toBe(false);
  });
});

describe('TutorService streaming chat', () => {
  function createStreamingService(
    generateTutorResponseStream: AgentService['generateTutorResponseStream'],
  ): { service: TutorService; session: LearningSession } {
    const agent = {
      generateTutorResponseStream,
    } as unknown as AgentService;
    const messages = {
      find: jest.fn(async () => []),
      create: jest.fn((value: Partial<TutorMessage>) => value as TutorMessage),
      save: jest.fn(async (value: Partial<TutorMessage>) => ({
        id: 'message-id',
        createdAt: new Date(),
        ...value,
      })),
    } as unknown as Repository<TutorMessage>;
    const conversations = {
      findOne: jest.fn(async () => ({ id: 'conversation-id' })),
    } as unknown as Repository<TutorConversation>;
    return {
      service: new TutorService(agent, conversations, messages),
      session: {
        id: 'session-id',
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: "Coulomb's Law and Charge",
      } as LearningSession,
    };
  }

  it('yields chunks as they arrive and persists the assembled message', async () => {
    async function* stream() {
      yield 'The SI unit ';
      yield 'of charge is the coulomb.';
    }
    const { service, session } = createStreamingService(stream);

    const generator = service.answerLearnerMessageStream(
      'user-id',
      session,
      null,
      null,
      false,
      'What is the SI unit of charge?',
    );
    const chunks: string[] = [];
    let step = await generator.next();
    while (!step.done) {
      chunks.push(step.value);
      step = await generator.next();
    }

    expect(chunks).toEqual(['The SI unit ', 'of charge is the coulomb.']);
    expect(step.value.content).toBe('The SI unit of charge is the coulomb.');
  });

  it('falls back to deterministic guidance when the stream fails before yielding anything', async () => {
    async function* stream(): AsyncGenerator<string> {
      throw new Error('model unavailable');

      yield '';
    }
    const { service, session } = createStreamingService(stream);

    const generator = service.answerLearnerMessageStream(
      'user-id',
      session,
      null,
      null,
      false,
      'I am stuck on this topic.',
    );
    const chunks: string[] = [];
    let step = await generator.next();
    while (!step.done) {
      chunks.push(step.value);
      step = await generator.next();
    }

    expect(chunks).toHaveLength(1);
    expect(step.value.content.length).toBeGreaterThan(0);
  });

  it('shapes the offline fallback differently for hint, explain, and why-wrong prompts', async () => {
    async function* failingStream(): AsyncGenerator<string> {
      throw new Error('model unavailable');

      yield '';
    }
    const question: LearningQuestionReference = {
      source: LearningQuestionSource.CURATED,
      id: 'question-id',
      questionText: 'What does Gauss law relate flux to?',
      options: [
        'Total charge',
        'Enclosed charge',
        'Surface area',
        'Field strength',
      ],
      correctAnswer: 'Enclosed charge',
      solution:
        'Gauss law relates flux through a closed surface to the charge it encloses.',
      hint: null,
      conceptTags: ["Gauss's law"],
      commonErrors: [
        'Confusing total charge near the surface with enclosed charge',
        'Assuming symmetry that the surface does not have',
      ],
      bloomLevel: 'Understand',
      difficulty: 'Medium',
    };

    const contentsByPrompt = new Map<string, string>();
    for (const prompt of [
      'Give me a hint without revealing the answer.',
      'Explain this in simpler steps.',
      'Why is my selected option wrong?',
    ]) {
      const { service, session } = createStreamingService(failingStream);
      const generator = service.answerLearnerMessageStream(
        'user-id',
        session,
        null,
        question,
        false,
        prompt,
      );
      let step = await generator.next();
      while (!step.done) step = await generator.next();
      contentsByPrompt.set(prompt, step.value.content);
    }

    const contents = [...contentsByPrompt.values()];
    expect(new Set(contents).size).toBe(contents.length);
  });
});

describe('TutorService topic revision', () => {
  it('returns the generated revision when the AI call succeeds', async () => {
    const generateTutorResponse = jest.fn(
      async () =>
        "### Gauss's Law\n\nFlux equals enclosed charge over epsilon0.",
    );
    const agent = { generateTutorResponse } as unknown as AgentService;
    const messages = {} as unknown as Repository<TutorMessage>;
    const conversations = {} as unknown as Repository<TutorConversation>;
    const service = new TutorService(agent, conversations, messages);

    const result = await service.getTopicRevision(
      {
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: "Gauss's Law",
      },
      'reviewed material digest',
    );

    expect(result.grounded).toBe(true);
    expect(result.content).toContain('Flux equals enclosed charge');
    expect(generateTutorResponse).toHaveBeenCalledWith(
      expect.objectContaining({ explanatory: true, answerRevealed: false }),
    );
  });

  it('falls back to the reviewed-material digest when the AI call fails', async () => {
    const generateTutorResponse = jest.fn(async () => {
      throw new Error('model unavailable');
    });
    const agent = { generateTutorResponse } as unknown as AgentService;
    const messages = {} as unknown as Repository<TutorMessage>;
    const conversations = {} as unknown as Repository<TutorConversation>;
    const service = new TutorService(agent, conversations, messages);

    const result = await service.getTopicRevision(
      {
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: "Gauss's Law",
      },
      'Question concept: flux through a closed surface.',
    );

    expect(result.grounded).toBe(false);
    expect(result.content).toContain("Gauss's Law");
    expect(result.content).toContain(
      'Question concept: flux through a closed surface.',
    );
  });
});
