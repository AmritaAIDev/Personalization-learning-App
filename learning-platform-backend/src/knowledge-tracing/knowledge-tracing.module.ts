import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeTracingController } from './knowledge-tracing.controller';
import { KnowledgeTracingService } from './knowledge-tracing.service';
import { SkillMastery } from './skill-mastery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SkillMastery])],
  controllers: [KnowledgeTracingController],
  providers: [KnowledgeTracingService],
  exports: [KnowledgeTracingService],
})
export class KnowledgeTracingModule {}
