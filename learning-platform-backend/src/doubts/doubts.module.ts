import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { Doubt } from './doubt.entity';
import { DoubtsController } from './doubts.controller';
import { DoubtsService } from './doubts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Doubt]), AgentModule],
  controllers: [DoubtsController],
  providers: [DoubtsService],
})
export class DoubtsModule {}
