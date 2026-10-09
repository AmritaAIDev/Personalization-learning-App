import { Module } from '@nestjs/common';
import { KnowledgeTracingModule } from '../knowledge-tracing/knowledge-tracing.module';
import { TutorMemoryService } from './tutor-memory.service';

@Module({
  imports: [KnowledgeTracingModule],
  providers: [TutorMemoryService],
  exports: [TutorMemoryService],
})
export class TutorMemoryModule {}
