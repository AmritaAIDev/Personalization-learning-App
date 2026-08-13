import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { MisconceptionHit } from './misconception-hit.entity';
import { MisconceptionsService } from './misconceptions.service';

@Module({
  imports: [AgentModule, TypeOrmModule.forFeature([MisconceptionHit])],
  providers: [MisconceptionsService],
  exports: [MisconceptionsService],
})
export class MisconceptionsModule {}
