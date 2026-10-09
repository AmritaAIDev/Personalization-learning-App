import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { toPersonalization } from './personalization';
import { UpdatePersonalizationDto } from './update-personalization.dto';
import { User } from './user.entity';
import { levelForXp } from './user-progress';
import { UpdateUserRoleDto } from './update-user-role.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    const currentUser = await this.usersService.findById(user.id);
    return { data: { user: this.toMe(currentUser) } };
  }

  /**
   * The signed-in student's own class / stream / target month / daily budget.
   * Always acts on the caller (never on an id from the URL or body).
   * `targetMonthChanged` tells the client the study plan needs rebuilding.
   */
  @Patch('me/personalization')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async updatePersonalization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePersonalizationDto,
  ) {
    const result = await this.usersService.updatePersonalization(user.id, dto);
    return {
      data: {
        user: this.toMe(result.user),
        targetMonthChanged: result.targetMonthChanged,
      },
    };
  }

  private toMe(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      xp: user.xp,
      level: levelForXp(user.xp),
      streak: user.streak,
      personalization: toPersonalization(user),
    };
  }

  @Get()
  @Roles('admin')
  async listUsers() {
    const users = await this.usersService.findAll();
    return {
      data: {
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          xp: u.xp,
          level: levelForXp(u.xp),
          streak: u.streak,
          createdAt: u.createdAt,
        })),
      },
    };
  }

  @Patch(':userId/role')
  @Roles('admin')
  async updateUserRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    const user = await this.usersService.updateRole(
      userId,
      body.role,
      admin.id,
    );
    return {
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: levelForXp(user.xp),
          streak: user.streak,
        },
      },
    };
  }
}
