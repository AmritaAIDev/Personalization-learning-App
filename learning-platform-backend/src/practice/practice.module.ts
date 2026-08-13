import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../question.entity';
import { AgentModule } from '../agent/agent.module';
import { MisconceptionsModule } from '../misconceptions/misconceptions.module';
import { PracticeAnswer } from './practice-answer.entity';
import { PracticeAttempt } from './practice-attempt.entity';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PracticeAttempt, PracticeAnswer, Question]),
    AgentModule,
    MisconceptionsModule,
  ],
  controllers: [PracticeController],
  providers: [PracticeService],
})
export class PracticeModule {}
