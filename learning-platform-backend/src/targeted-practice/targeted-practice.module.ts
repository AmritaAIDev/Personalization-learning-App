import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdaptiveModule } from '../adaptive/adaptive.module';
import { AgentModule } from '../agent/agent.module';
import { TargetedPracticeQuestion } from './targeted-practice-question.entity';
import { TargetedPracticeController } from './targeted-practice.controller';
import { TargetedPracticeService } from './targeted-practice.service';

@Module({
  imports: [
    AgentModule,
    AdaptiveModule,
    TypeOrmModule.forFeature([TargetedPracticeQuestion]),
  ],
  controllers: [TargetedPracticeController],
  providers: [TargetedPracticeService],
  exports: [TargetedPracticeService],
})
export class TargetedPracticeModule {}
