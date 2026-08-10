import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { LearningSessionItem } from '../adaptive/learning-session-item.entity';
import { GeneratedLearningQuestion } from '../adaptive/generated-learning-question.entity';
import { Question } from '../question.entity';
import { Doubt } from './doubt.entity';
import { DoubtThread } from './doubt-thread.entity';
import { DoubtsController } from './doubts.controller';
import { DoubtsService } from './doubts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoubtThread,
      Doubt,
      LearningSessionItem,
      GeneratedLearningQuestion,
      Question,
    ]),
    AgentModule,
  ],
  controllers: [DoubtsController],
  providers: [DoubtsService],
})
export class DoubtsModule {}
