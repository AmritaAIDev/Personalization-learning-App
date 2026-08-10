import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { normalizeDatabaseUrl } from './database-url';
import { AuthSession } from '../auth/auth-session.entity';
import { DiagnosticAnswer } from '../diagnostics/diagnostic-answer.entity';
import { DiagnosticAttempt } from '../diagnostics/diagnostic-attempt.entity';
import { LearningResource } from '../diagnostics/learning-resource.entity';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { PracticeAttempt } from '../practice/practice-attempt.entity';
import { Question } from '../question.entity';
import { TestSession } from '../sessions/test-session.entity';
import { Topic } from '../topics/topic.entity';
import { User } from '../users/user.entity';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { LearningSession } from '../adaptive/learning-session.entity';
import { LearningSessionItem } from '../adaptive/learning-session-item.entity';
import { LearningAnswer } from '../adaptive/learning-answer.entity';
import { GeneratedLearningQuestion } from '../adaptive/generated-learning-question.entity';
import { GenerationJob } from '../adaptive/generation-job.entity';
import { Flashcard } from '../adaptive/flashcard.entity';
import { FlashcardReview } from '../adaptive/flashcard-review.entity';
import { TutorConversation } from '../adaptive/tutor-conversation.entity';
import { TutorMessage } from '../adaptive/tutor-message.entity';
import { Doubt } from '../doubts/doubt.entity';
import { DoubtThread } from '../doubts/doubt-thread.entity';
import { NotebookConceptSummary } from '../notebook/notebook-concept-summary.entity';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set to run migrations.');
}

const sslEnabled = process.env.DATABASE_SSL !== 'false';
const rejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

export default new DataSource({
  type: 'postgres',
  url: normalizeDatabaseUrl(databaseUrl, sslEnabled),
  ssl: sslEnabled ? { rejectUnauthorized } : false,
  entities: [
    User,
    Topic,
    Question,
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
  ],
  migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false,
});
