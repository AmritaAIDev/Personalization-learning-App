import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMockUser(): Promise<User> {
    // For prototyping: simply fetch the first student user from the DB
    const user = await this.userRepository.findOne({
      where: { role: 'student' },
    });
    if (!user) {
      throw new NotFoundException(
        'No mock user found in database. Did you run the seeder?',
      );
    }
    return user;
  }
}
