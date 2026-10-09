import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { targetMonthProblem } from './personalization';
import type { UpdatePersonalizationDto } from './update-personalization.dto';
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

  /**
   * Saves the student's own class / stream / target month / daily budget.
   * The profile counts as complete once class, stream and target month are all
   * set; the first time that happens is recorded and never reset.
   * `targetMonthChanged` tells the caller the study plan is now out of date.
   */
  async updatePersonalization(
    userId: string,
    input: UpdatePersonalizationDto,
    now: Date = new Date(),
  ): Promise<{ user: User; targetMonthChanged: boolean }> {
    const user = await this.findById(userId);

    const targetMonthChanged =
      input.targetMonth !== undefined && input.targetMonth !== user.targetMonth;
    // An unchanged month is accepted even once it has passed, so a student can
    // edit their stream without being forced to pick a new month.
    if (targetMonthChanged) {
      const problem = targetMonthProblem(input.targetMonth as string, now);
      if (problem) throw new BadRequestException(problem);
    }

    if (input.className !== undefined) user.className = input.className;
    if (input.stream !== undefined) user.stream = input.stream;
    if (input.targetMonth !== undefined) user.targetMonth = input.targetMonth;
    if (input.dailyMinutes !== undefined) {
      user.dailyMinutes = input.dailyMinutes;
    }
    if (
      user.personalizationCompletedAt === null &&
      user.className &&
      user.stream &&
      user.targetMonth
    ) {
      user.personalizationCompletedAt = now;
    }

    const saved = await this.userRepository.save(user);
    return { user: saved, targetMonthChanged };
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
