import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import type { StudentRole } from '../auth/auth.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateRole(
    userId: string,
    role: StudentRole,
    actingUserId: string,
  ): Promise<User> {
    if (role !== 'student' && role !== 'admin') {
      throw new BadRequestException('Invalid role.');
    }
    if (userId === actingUserId && role !== 'admin') {
      throw new BadRequestException(
        'You cannot demote your own administrator role.',
      );
    }
    const user = await this.findById(userId);
    user.role = role;
    return this.userRepository.save(user);
  }
}
