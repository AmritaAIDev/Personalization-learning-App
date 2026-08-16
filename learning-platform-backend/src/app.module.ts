import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Question } from './question.entity';
import { QuestionReport } from './question-report.entity';
import { QuestionsModule } from './questions.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { Topic } from './topics/topic.entity';
import { TopicsModule } from './topics/topics.module';
import { TestSession } from './sessions/test-session.entity';
import { SessionsModule } from './sessions/sessions.module';
import { AuthModule } from './auth/auth.module';
import { AuthSession } from './auth/auth-session.entity';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { DiagnosticAttempt } from './diagnostics/diagnostic-attempt.entity';
import { DiagnosticAnswer } from './diagnostics/diagnostic-answer.entity';
import { LearningResource } from './diagnostics/learning-resource.entity';
import { PracticeModule } from './practice/practice.module';
import { PracticeAttempt } from './practice/practice-attempt.entity';
import { PracticeAnswer } from './practice/practice-answer.entity';
import { normalizeDatabaseUrl } from './database/database-url';
import { AdaptiveModule } from './adaptive/adaptive.module';
import { LearningTopicState } from './adaptive/learning-topic-state.entity';
import { LearningSession } from './adaptive/learning-session.entity';
import { LearningSessionItem } from './adaptive/learning-session-item.entity';
import { LearningAnswer } from './adaptive/learning-answer.entity';
import { GeneratedLearningQuestion } from './adaptive/generated-learning-question.entity';
import { GenerationJob } from './adaptive/generation-job.entity';
import { Flashcard } from './adaptive/flashcard.entity';
import { FlashcardReview } from './adaptive/flashcard-review.entity';
import { TutorConversation } from './adaptive/tutor-conversation.entity';
import { TutorMessage } from './adaptive/tutor-message.entity';
import { NotebookModule } from './notebook/notebook.module';
import { Doubt } from './doubts/doubt.entity';
import { DoubtThread } from './doubts/doubt-thread.entity';
import { NotebookConceptSummary } from './notebook/notebook-concept-summary.entity';
import { DoubtsModule } from './doubts/doubts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MockTestAttempt } from './mock-tests/mock-test-attempt.entity';
import { MockTestAnswer } from './mock-tests/mock-test-answer.entity';
import { MockTestsModule } from './mock-tests/mock-tests.module';
import { HealthModule } from './health/health.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { MisconceptionHit } from './misconceptions/misconception-hit.entity';
import { MisconceptionsModule } from './misconceptions/misconceptions.module';
import { TargetedPracticeQuestion } from './targeted-practice/targeted-practice-question.entity';
import { TargetedPracticeModule } from './targeted-practice/targeted-practice.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env'), '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const sslEnabled =
          configService.get<string>('DATABASE_SSL') !== 'false';
        const rejectUnauthorized =
          configService.get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED') !==
          'false';
        return {
          type: 'postgres' as const,
          url: normalizeDatabaseUrl(
            configService.getOrThrow<string>('DATABASE_URL'),
            sslEnabled,
          ),
          ssl: sslEnabled ? { rejectUnauthorized } : false,
          entities: [
            Question,
            QuestionReport,
            User,
            Topic,
            TestSession,
            AuthSession,
            DiagnosticAttempt,
            DiagnosticAnswer,
            LearningResource,
            PracticeAttempt,
            PracticeAnswer,
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
            DoubtThread,
            Doubt,
            NotebookConceptSummary,
            MockTestAttempt,
            MockTestAnswer,
            MisconceptionHit,
            TargetedPracticeQuestion,
          ],
          migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
          synchronize: false,
          migrationsRun: false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Question]),
    QuestionsModule,
    UsersModule,
    TopicsModule,
    SessionsModule,
    AuthModule,
    DiagnosticsModule,
    PracticeModule,
    AdaptiveModule,
    NotebookModule,
    DoubtsModule,
    DashboardModule,
    MockTestsModule,
    HealthModule,
    MisconceptionsModule,
    TargetedPracticeModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
