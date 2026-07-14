import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSession } from './test-session.entity';
import { Topic } from '../topics/topic.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([TestSession, Topic])],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [TypeOrmModule, SessionsService],
})
export class SessionsModule {}
