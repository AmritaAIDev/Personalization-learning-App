import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningAnswer } from '../adaptive/learning-answer.entity';
import { MisconceptionsModule } from '../misconceptions/misconceptions.module';
import { NotebookConceptSummary } from './notebook-concept-summary.entity';
import { NotebookMistakeReview } from './notebook-mistake-review.entity';
import { NotebookConceptService } from './notebook-concept.service';
import { DiagnosticAnswer } from '../diagnostics/diagnostic-answer.entity';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { NotebookController } from './notebook.controller';
import { NotebookService } from './notebook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PracticeAnswer,
      LearningAnswer,
      DiagnosticAnswer,
      NotebookConceptSummary,
      NotebookMistakeReview,
    ]),
    MisconceptionsModule,
  ],
  controllers: [NotebookController],
  providers: [NotebookService, NotebookConceptService],
  exports: [NotebookService],
})
export class NotebookModule {}
