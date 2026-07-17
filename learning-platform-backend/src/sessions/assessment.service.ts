import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSession } from './test-session.entity';
import { Question } from '../question.entity';
import { Topic } from '../topics/topic.entity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(TestSession)
    private sessionsRepository: Repository<TestSession>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  private mapTaxonomyToEnum(t: number): string {
    const map = { 1: 'Remember', 2: 'Understand', 3: 'Apply', 4: 'Analyze', 5: 'Evaluate', 6: 'Create' };
    return map[t] || 'Remember';
  }

  private mapDifficultyToEnum(d: number): string {
    const map = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
    return map[d] || 'Easy';
  }

  async startAssessment(userId: string, topicId: string) {
    let session = await this.sessionsRepository.findOne({
      where: { user_id: userId, topic_id: topicId },
    });

    if (!session) {
      session = this.sessionsRepository.create({
        user_id: userId,
        topic_id: topicId,
        current_taxonomy: 1,
        current_difficulty: 1,
        streak_counter: 0,
        failed_attempts: 0,
        status: 'in-progress',
      });
      await this.sessionsRepository.save(session);
    }

    const bloomLevel = this.mapTaxonomyToEnum(session.current_taxonomy);
    const difficultyLevel = this.mapDifficultyToEnum(session.current_difficulty);

    const questions = await this.questionsRepository.find({
      where: { bloom_level: bloomLevel, difficulty: difficultyLevel },
      take: 5,
    });

    return {
      session,
      queue: questions,
    };
  }

  async submitAnswer(userId: string, topicId: string, questionId: string, isCorrect: boolean) {
    const session = await this.sessionsRepository.findOne({
      where: { user_id: userId, topic_id: topicId },
    });

    if (!session) throw new NotFoundException('Session not found');

    if (isCorrect) {
      session.streak_counter += 1;
      session.failed_attempts = 0;
      session.currentScore += 10; // basic arbitrary score for now

      if (session.streak_counter >= 5) {
        // Positive State Transition (Promotion)
        session.streak_counter = 0;

        if (session.current_taxonomy < 6) {
          session.current_taxonomy += 1; // Prioritize Cognitive Depth
        } else {
          if (session.current_difficulty < 3) {
            session.current_taxonomy = 1; // Loop taxonomy
            session.current_difficulty += 1; // Elevate difficulty
          } else {
            // Reached T6, D3 - Topic Completed!
            session.status = 'completed';
            session.endedAt = new Date();
          }
        }
      }
    } else {
      session.failed_attempts += 1;

      if (session.failed_attempts === 1) {
        await this.sessionsRepository.save(session);
        return {
          status: 'socratic_pause',
          message: 'Socratic intervention required. Halt progression.',
          session,
        };
      }

      if (session.failed_attempts >= 2) {
        // Negative State Transition (Demotion)
        session.failed_attempts = 0;
        session.streak_counter = 0;

        if (session.current_taxonomy > 1) {
          session.current_taxonomy -= 1; // Intra-difficulty demotion
        } else if (session.current_difficulty > 1) {
          session.current_taxonomy = 6; // Base case: drop a difficulty tier
          session.current_difficulty -= 1;
        } else {
          // Absolute Floor Boundary (T1, D1)
          await this.sessionsRepository.save(session);
          return await this.handleDagFallback(userId, topicId, session);
        }
      }
    }

    await this.sessionsRepository.save(session);

    return {
      status: session.status === 'completed' ? 'completed' : 'active',
      session,
    };
  }

  private async handleDagFallback(userId: string, currentTopicId: string, currentSession: TestSession) {
    const topic = await this.topicsRepository.findOne({
      where: { id: currentTopicId },
      relations: ['prerequisites'],
    });

    if (!topic || !topic.prerequisites || topic.prerequisites.length === 0) {
      return { status: 'failure_floor_no_prereq', session: currentSession };
    }

    // Direct Prerequisite Routing
    const prereq = topic.prerequisites[0];
    
    // Pause current
    currentSession.status = 'paused_for_prereq';
    await this.sessionsRepository.save(currentSession);

    // Init prereq session
    const prereqAssessment = await this.startAssessment(userId, prereq.id);

    return {
      status: 'dag_fallback_triggered',
      message: `User forcibly routed to prerequisite topic: ${prereq.name}`,
      prerequisiteSession: prereqAssessment.session,
    };
  }
}
