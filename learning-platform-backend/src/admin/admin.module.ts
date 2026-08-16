import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { DiagnosticsModule } from '../diagnostics/diagnostics.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, DashboardModule, DiagnosticsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
