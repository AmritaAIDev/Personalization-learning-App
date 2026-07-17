import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSession } from './test-session.entity';
import { Topic } from '../topics/topic.entity';
import { Question } from '../question.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TestSession, Topic, Question])],
  providers: [SessionsService, AssessmentService],
  controllers: [SessionsController, AssessmentController],
  exports: [TypeOrmModule, SessionsService, AssessmentService],
})
export class SessionsModule {}
