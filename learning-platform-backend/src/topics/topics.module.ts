import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './topic.entity';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Topic])],
  providers: [TopicsService],
  controllers: [TopicsController],
  exports: [TypeOrmModule, TopicsService],
})
export class TopicsModule {}
