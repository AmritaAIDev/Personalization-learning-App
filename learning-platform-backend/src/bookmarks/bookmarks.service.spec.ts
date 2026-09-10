import { NotFoundException } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';

function makeQuestionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'question-1',
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: "Coulomb's Law",
    question_text: 'What is the SI unit of charge?',
    options: ['Coulomb', 'Ampere', 'Volt', 'Ohm'],
    correct_answer: 'Coulomb',
    solution: 'Charge is measured in coulombs.',
    difficulty: 'Easy',
    bloom_level: 'Remember',
    concept_tags: ['charge'],
    ...overrides,
  };
}

describe('BookmarksService', () => {
  const bookmarks = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((row: unknown) => row),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const questions = { findOne: jest.fn() };
  let service: BookmarksService;

  beforeEach(() => {
    jest.resetAllMocks();
    bookmarks.create.mockImplementation((row: unknown) => row);
    service = new BookmarksService(bookmarks as never, questions as never);
  });

  describe('toggle', () => {
    it('creates a bookmark for an existing question when none exists yet', async () => {
      bookmarks.findOne.mockResolvedValue(null);
      questions.findOne.mockResolvedValue({ id: 'question-1' });

      const result = await service.toggle('user-1', 'question-1');

      expect(result).toEqual({ bookmarked: true });
      expect(bookmarks.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', questionId: 'question-1' }),
      );
      expect(bookmarks.delete).not.toHaveBeenCalled();
    });

    it('removes an existing bookmark instead of creating a duplicate', async () => {
      bookmarks.findOne.mockResolvedValue({ id: 'bookmark-1' });

      const result = await service.toggle('user-1', 'question-1');

      expect(result).toEqual({ bookmarked: false });
      expect(bookmarks.delete).toHaveBeenCalledWith({ id: 'bookmark-1' });
      expect(bookmarks.save).not.toHaveBeenCalled();
      // Only checked when actually creating — already-bookmarked path
      // shouldn't need to re-verify the question exists.
      expect(questions.findOne).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the question does not exist', async () => {
      bookmarks.findOne.mockResolvedValue(null);
      questions.findOne.mockResolvedValue(null);

      await expect(service.toggle('user-1', 'missing-question')).rejects.toThrow(
        NotFoundException,
      );
      expect(bookmarks.save).not.toHaveBeenCalled();
    });
  });

  describe('getBookmarkedIds', () => {
    it('returns only the question ids, scoped to the user', async () => {
      bookmarks.find.mockResolvedValue([
        { questionId: 'q1' },
        { questionId: 'q2' },
      ]);
      const ids = await service.getBookmarkedIds('user-1');
      expect(ids).toEqual(['q1', 'q2']);
      expect(bookmarks.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  describe('getBookmarks', () => {
    it('maps joined question rows into the view shape, newest first', async () => {
      bookmarks.find.mockResolvedValue([
        {
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          question: makeQuestionRow(),
        },
      ]);
      const result = await service.getBookmarks('user-1');
      expect(result).toEqual([
        {
          questionId: 'question-1',
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: "Coulomb's Law",
          questionText: 'What is the SI unit of charge?',
          options: ['Coulomb', 'Ampere', 'Volt', 'Ohm'],
          correctAnswer: 'Coulomb',
          solution: 'Charge is measured in coulombs.',
          difficulty: 'Easy',
          bloomLevel: 'Remember',
          conceptTags: ['charge'],
          bookmarkedAt: '2026-01-02T00:00:00.000Z',
        },
      ]);
    });

    it('silently drops rows whose question was deleted (CASCADE races)', async () => {
      bookmarks.find.mockResolvedValue([
        { createdAt: new Date(), question: null },
      ]);
      const result = await service.getBookmarks('user-1');
      expect(result).toEqual([]);
    });
  });
});
