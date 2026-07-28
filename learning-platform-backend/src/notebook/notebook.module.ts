import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningAnswer } from '../adaptive/learning-answer.entity';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { NotebookController } from './notebook.controller';
import { NotebookService } from './notebook.service';

@Module({
  imports: [TypeOrmModule.forFeature([PracticeAnswer, LearningAnswer])],
  controllers: [NotebookController],
  providers: [NotebookService],
})
export class NotebookModule {}
