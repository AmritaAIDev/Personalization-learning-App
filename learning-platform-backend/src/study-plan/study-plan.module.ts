import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { UsersModule } from '../users/users.module';
import { StudyPlan, StudyPlanTask } from './study-plan.entity';
import { StudyPlanController } from './study-plan.controller';
import { StudyPlanService } from './study-plan.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyPlan, StudyPlanTask]),
    CatalogModule,
    UsersModule,
  ],
  controllers: [StudyPlanController],
  providers: [StudyPlanService],
  exports: [StudyPlanService],
})
export class StudyPlanModule {}
