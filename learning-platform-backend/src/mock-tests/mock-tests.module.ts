import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { Question } from '../question.entity';
import { MockTestAnswer } from './mock-test-answer.entity';
import { MockTestAttempt } from './mock-test-attempt.entity';
import { MockTestsController } from './mock-tests.controller';
import { MockTestsService } from './mock-tests.service';

@Module({
  imports: [
    CatalogModule,
    TypeOrmModule.forFeature([MockTestAttempt, MockTestAnswer, Question]),
  ],
  controllers: [MockTestsController],
  providers: [MockTestsService],
})
export class MockTestsModule {}
