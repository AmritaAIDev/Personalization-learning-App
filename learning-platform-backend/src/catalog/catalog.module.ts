import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { BookmarkedQuestion } from '../bookmarks/bookmarked-question.entity';
import { Question } from '../question.entity';
import { Topic } from '../topics/topic.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { ChapterMeta } from './chapter-meta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Topic,
      ChapterMeta,
      LearningTopicState,
      Question,
      BookmarkedQuestion,
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
