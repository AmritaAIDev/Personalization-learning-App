import { IsIn } from 'class-validator';
import type { StudentRole } from '../auth/auth.types';

export class UpdateUserRoleDto {
  @IsIn(['student', 'admin'])
  role: StudentRole;
}
