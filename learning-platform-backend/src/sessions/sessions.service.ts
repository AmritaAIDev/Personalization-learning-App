import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSession } from './test-session.entity';
import { Topic, TopicLevel } from '../topics/topic.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(TestSession)
    private sessionsRepository: Repository<TestSession>,
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  async getJourneyForUser(userId: string) {
    // 1. Fetch all curriculum topics to map out the journey nodes
    // In a real app we might order these by a sequence or difficulty field.
    const allTopics = await this.topicsRepository.find({
      relations: { parent: true },
      order: { createdAt: 'ASC' },
    });

    // 2. Fetch the user's test sessions to see their progress
    // Since we don't have real auth yet, we bypass userId strict checking if "mock-user" is passed
    const sessions = await this.sessionsRepository.find({
      where: userId === 'mock-user' ? {} : { user_id: userId },
      relations: { topic: true },
    });

    // Map session scores to topics
    const sessionMap = new Map<string, number>();
    sessions.forEach((s) => {
      sessionMap.set(
        s.topic_id,
        Math.max(sessionMap.get(s.topic_id) || 0, s.currentScore),
      );
    });

    const chapters = allTopics.filter((t) => t.level === TopicLevel.CHAPTER);
    const subtopics = allTopics.filter((t) => t.level === TopicLevel.SUB_TOPIC);

    let previousChapterState = 'completed'; // Used to find the first active chapter

    const journey = chapters.map((chapter) => {
      const chapterSubtopics = subtopics.filter(
        (sub) => sub.parent?.id === chapter.id,
      );

      const mappedSubtopics = chapterSubtopics.map((sub) => {
        const subScore = sessionMap.get(sub.id) ?? null;
        return {
          name: sub.name,
          score: subScore,
        };
      });

      // Chapter state calculation based on seed data rules
      const chapterScore = sessionMap.get(chapter.id) ?? null;
      const chapterSession = sessions.find((s) => s.topic_id === chapter.id);
      let state = 'locked';

      if (chapterSession) {
        state = chapterSession.status === 'completed' ? 'completed' : 'active';
      } else if (previousChapterState === 'completed') {
        state = 'active'; // First node without a session after a completed node becomes active
      }

      previousChapterState = state;

      return {
        id: chapter.id,
        name: chapter.name,
        subject: chapter.parent ? chapter.parent.name : 'General',
        state: state,
        score: chapterScore,
        subtopics: mappedSubtopics,
      };
    });

    return journey;
  }
}
