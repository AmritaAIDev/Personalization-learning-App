import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { Question } from './question.entity';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question]), AgentModule],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
