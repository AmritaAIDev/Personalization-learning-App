import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Roles('admin')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    return { data: await this.adminService.getOverview() };
  }

  @Get('students/:id')
  async getStudentDetail(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.adminService.getStudentDetail(id) };
  }
}
