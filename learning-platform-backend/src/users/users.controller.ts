import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
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
    return {
      data: {
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          xp: currentUser.xp,
          level: levelForXp(currentUser.xp),
          streak: currentUser.streak,
        },
      },
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
