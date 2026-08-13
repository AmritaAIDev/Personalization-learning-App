import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { MisconceptionsModule } from '../misconceptions/misconceptions.module';
import { Question } from '../question.entity';
import { Topic } from '../topics/topic.entity';
import { User } from '../users/user.entity';
import { AdaptiveContentService } from './adaptive-content.service';
import { AdaptiveController } from './adaptive.controller';
import { AdaptiveService } from './adaptive.service';
import { CompetencyService } from './competency.service';
import { Flashcard } from './flashcard.entity';
import { FlashcardReview } from './flashcard-review.entity';
import { GeneratedLearningQuestion } from './generated-learning-question.entity';
import { GenerationJob } from './generation-job.entity';
import { GenerationWorkerService } from './generation-worker.service';
import { LearningAnswer } from './learning-answer.entity';
import { LearningSessionItem } from './learning-session-item.entity';
import { LearningSession } from './learning-session.entity';
import { LearningTopicState } from './learning-topic-state.entity';
import { TutorConversation } from './tutor-conversation.entity';
import { TutorMessage } from './tutor-message.entity';
import { TutorService } from './tutor.service';

@Module({
  imports: [
    AgentModule,
    MisconceptionsModule,
    TypeOrmModule.forFeature([
      User,
      Topic,
      Question,
      LearningTopicState,
      LearningSession,
      LearningSessionItem,
      LearningAnswer,
      GeneratedLearningQuestion,
      GenerationJob,
      Flashcard,
      FlashcardReview,
      TutorConversation,
      TutorMessage,
    ]),
  ],
  controllers: [AdaptiveController],
  providers: [
    AdaptiveService,
    AdaptiveContentService,
    CompetencyService,
    GenerationWorkerService,
    TutorService,
  ],
  exports: [AdaptiveService, CompetencyService, AdaptiveContentService],
})
export class AdaptiveModule {}
