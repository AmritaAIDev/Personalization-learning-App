import type { Request } from 'express';

export type StudentRole = 'student' | 'admin';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: StudentRole;
  xp: number;
  level: number;
  streak: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
