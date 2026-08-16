import type { HistoryItem, UserRole } from "./diagnostic-types";
import type { StudentDashboardPayload } from "./student-dashboard-types";

export type AdminOverview = {
  totalStudents: number;
  totalAdmins: number;
  activeToday: number;
  avgLevel: number;
  avgXp: number;
};

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  xp: number;
  level: number;
  streak: number;
  createdAt: string;
};

export type AdminStudentDetail = {
  profile: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    xp: number;
    level: number;
    streak: number;
    createdAt: string;
  };
  dashboard: StudentDashboardPayload;
  history: HistoryItem[];
};
