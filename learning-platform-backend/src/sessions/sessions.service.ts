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
    // 2. Fetch the user's test sessions to see their progress
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

    const historyTopicIds = new Set(sessions.map(s => s.topic_id));

    // 1. Fetch all curriculum topics to map out the journey nodes
    const allTopics = await this.topicsRepository.find({
      relations: { parent: true, prerequisites: true },
      order: { createdAt: 'ASC' },
    });

    const subtopics = allTopics.filter((t) => t.level === TopicLevel.SUB_TOPIC);
    const chapters = allTopics.filter((t) => t.level === TopicLevel.CHAPTER);

    // Filter to personalized nodes (History + Prerequisites + Next Steps)
    const personalizedSubtopicIds = new Set<string>();
    
    subtopics.forEach(sub => {
      // Bucket 1: History
      if (historyTopicIds.has(sub.id)) {
        personalizedSubtopicIds.add(sub.id);
        // Bucket 2: Prerequisites of History
        sub.prerequisites?.forEach(p => personalizedSubtopicIds.add(p.id));
      }
      
      // Bucket 3: Recommended Next Steps (Fog of War)
      const requiresHistoryNode = sub.prerequisites?.some(p => historyTopicIds.has(p.id));
      if (requiresHistoryNode) {
        personalizedSubtopicIds.add(sub.id);
      }
    });

    // Fallback: If brand new user, show the first 3 topics
    if (personalizedSubtopicIds.size === 0) {
      subtopics.slice(0, 3).forEach(s => personalizedSubtopicIds.add(s.id));
    }

    let previousChapterState = 'completed'; // Used to find the first active chapter

    const journey = chapters.map((chapter) => {
      const chapterSubtopics = subtopics.filter(
        (sub) => sub.parent?.id === chapter.id && personalizedSubtopicIds.has(sub.id)
      );

      if (chapterSubtopics.length === 0) return null;

      const mappedSubtopics = chapterSubtopics.map((sub) => {
        const subScore = sessionMap.get(sub.id) ?? null;
        
        // Calculate subtopic state based purely on DB prerequisite logic
        let state: 'locked' | 'active' | 'completed' = 'active';
        
        if (subScore !== null && subScore >= 80) {
          state = 'completed';
        } else if (sub.prerequisites && sub.prerequisites.length > 0) {
          // Check if any prerequisite has a score < 50 (or is unattempted)
          const hasUnmetPrereq = sub.prerequisites.some(prereq => {
            const prereqScore = sessionMap.get(prereq.id) ?? 0;
            return prereqScore < 50;
          });
          if (hasUnmetPrereq) {
            state = 'locked';
          }
        }

        // Add a specialized tag for the UI
        let nodeType = 'recommended';
        if (historyTopicIds.has(sub.id)) nodeType = 'history';
        else if (sub.prerequisites?.some(p => historyTopicIds.has(p.id))) nodeType = 'next-step';
        else nodeType = 'prerequisite';

        return {
          id: sub.id,
          name: sub.name,
          score: subScore,
          state: state,
          nodeType: nodeType, // Send custom tag to frontend
          prerequisites: sub.prerequisites?.map(p => ({
            id: p.id,
            name: p.name,
            score: sessionMap.get(p.id) ?? 0
          })) || [],
        };
      });

      // Chapter state calculation based on seed data rules
      const chapterScore = sessionMap.get(chapter.id) ?? null;
      const chapterSession = sessions.find((s) => s.topic_id === chapter.id);
      let state = 'locked';

      if (chapterSession) {
        state = chapterSession.status === 'completed' ? 'completed' : 'active';
      } else if (previousChapterState === 'completed') {
        state = 'active';
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
    }).filter(Boolean); // Remove null chapters

    return journey;
  }
}
