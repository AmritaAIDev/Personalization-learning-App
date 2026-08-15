import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../question.entity';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { AgentModule } from '../agent/agent.module';
import { DiagnosticAnswer } from './diagnostic-answer.entity';
import { DiagnosticAttempt } from './diagnostic-attempt.entity';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { LearningResource } from './learning-resource.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiagnosticAttempt,
      DiagnosticAnswer,
      LearningResource,
      Question,
      LearningTopicState,
      User,
    ]),
    AgentModule,
  ],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
