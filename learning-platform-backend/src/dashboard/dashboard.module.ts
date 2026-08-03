import { Module } from '@nestjs/common';
import { AdaptiveModule } from '../adaptive/adaptive.module';
import { DiagnosticsModule } from '../diagnostics/diagnostics.module';
import { NotebookModule } from '../notebook/notebook.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../question.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    AdaptiveModule,
    DiagnosticsModule,
    NotebookModule,
    TypeOrmModule.forFeature([Question]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
