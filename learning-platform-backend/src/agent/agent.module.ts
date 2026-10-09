import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentService } from './agent.service';
import { EmbeddingService } from './embedding.service';
import { Topic } from '../topics/topic.entity';
import { TutorMemoryModule } from '../tutor-memory/tutor-memory.module';

@Module({
  imports: [TypeOrmModule.forFeature([Topic]), TutorMemoryModule],
  providers: [AgentService, EmbeddingService],
  exports: [AgentService], // Exported so other modules like QuestionsModule can use it
})
export class AgentModule {}
