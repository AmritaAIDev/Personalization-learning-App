import type { Request } from 'express';
import type { PersonalizationProfile } from '../users/personalization';

export type StudentRole = 'student' | 'admin';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: StudentRole;
  xp: number;
  level: number;
  streak: number;
  personalization: PersonalizationProfile;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
