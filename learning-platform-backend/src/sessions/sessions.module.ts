import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSession } from './test-session.entity';
import { Topic } from '../topics/topic.entity';
import { Question } from '../question.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

/**
 * The legacy six-level assessment engine (AssessmentController/AssessmentService)
 * was retired in favour of the four-level adaptive engine in AdaptiveModule.
 * Only the read-only learner journey (used by Curriculum + Explorer) remains here.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TestSession, Topic, Question])],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [TypeOrmModule, SessionsService],
})
export class SessionsModule {}
