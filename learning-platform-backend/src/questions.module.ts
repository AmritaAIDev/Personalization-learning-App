import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { Question } from './question.entity';
import { QuestionReport } from './question-report.entity';
import { GeneratedLearningQuestion } from './adaptive/generated-learning-question.entity';
import { AgentModule } from './agent/agent.module';
import { TopicsModule } from './topics/topics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionReport,
      GeneratedLearningQuestion,
    ]),
    AgentModule,
    TopicsModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
