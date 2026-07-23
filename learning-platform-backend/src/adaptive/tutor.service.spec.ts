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
    const tutorPrompt = (generateTutorResponse.mock.calls as unknown[][])[0]?.[0] as {
      correctAnswer?: string;
    };
    expect(tutorPrompt.correctAnswer).toBeUndefined();
    expect(message.content).toContain('### Try this next');
    expect(message.content).not.toContain('Coulomb');
  });
});
