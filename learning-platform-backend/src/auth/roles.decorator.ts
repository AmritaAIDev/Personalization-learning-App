import { SetMetadata } from '@nestjs/common';
import type { StudentRole } from './auth.types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: StudentRole[]) => SetMetadata(ROLES_KEY, roles);
