import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticAttempt } from '../diagnostics/diagnostic-attempt.entity';
import { PracticeAttempt } from '../practice/practice-attempt.entity';
import { MockTestAttempt } from '../mock-tests/mock-test-attempt.entity';
import { StudentAchievement } from './student-achievement.entity';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiagnosticAttempt,
      PracticeAttempt,
      MockTestAttempt,
      StudentAchievement,
    ]),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
