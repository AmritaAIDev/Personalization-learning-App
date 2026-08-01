import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

/**
 * Journey/Curriculum is a read-only projection of adaptive learning state.
 */
@Module({
  imports: [TypeOrmModule.forFeature([LearningTopicState])],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [TypeOrmModule, SessionsService],
})
export class SessionsModule {}
