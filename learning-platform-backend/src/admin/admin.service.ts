import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardService } from '../dashboard/dashboard.service';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { levelForXp } from '../users/user-progress';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly dashboardService: DashboardService,
    private readonly diagnosticsService: DiagnosticsService,
  ) {}

  async getOverview() {
    const users = await this.usersService.findAll();
    const students = users.filter((user) => user.role !== 'admin');
    const admins = users.filter((user) => user.role === 'admin');
    const activeToday = students.filter((user) => user.streak > 0).length;

    return {
      totalStudents: students.length,
      totalAdmins: admins.length,
      activeToday,
      avgLevel: average(students.map((user) => levelForXp(user.xp))),
      avgXp: Math.round(average(students.map((user) => user.xp))),
    };
  }

  async getStudentDetail(userId: string) {
    const user = await this.usersService.findById(userId);
    const authUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'student',
      xp: user.xp,
      level: levelForXp(user.xp),
      streak: user.streak,
    };

    const [dashboard, history] = await Promise.all([
      this.dashboardService.getStudentDashboard(authUser),
      this.diagnosticsService.getHistory(userId),
    ]);

    return {
      profile: { ...authUser, createdAt: user.createdAt },
      dashboard,
      history,
    };
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
    ) / 10
  );
}
