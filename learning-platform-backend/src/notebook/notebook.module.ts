import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningAnswer } from '../adaptive/learning-answer.entity';
import { NotebookConceptSummary } from './notebook-concept-summary.entity';
import { NotebookConceptService } from './notebook-concept.service';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { NotebookController } from './notebook.controller';
import { NotebookService } from './notebook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PracticeAnswer,
      LearningAnswer,
      NotebookConceptSummary,
    ]),
  ],
  controllers: [NotebookController],
  providers: [NotebookService, NotebookConceptService],
  exports: [NotebookService],
})
export class NotebookModule {}
