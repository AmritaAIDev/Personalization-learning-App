import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotebookModule } from '../notebook/notebook.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { AdaptiveModule } from '../adaptive/adaptive.module';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { LearningResource } from '../diagnostics/learning-resource.entity';
import { RevisionController } from './revision.controller';
import { RevisionService } from './revision.service';

@Module({
  imports: [
    NotebookModule,
    BookmarksModule,
    AdaptiveModule,
    TypeOrmModule.forFeature([LearningTopicState, LearningResource]),
  ],
  controllers: [RevisionController],
  providers: [RevisionService],
})
export class RevisionModule {}
