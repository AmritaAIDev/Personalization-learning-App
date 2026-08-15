import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const userRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersService(userRepository as never);
  });

  describe('findById', () => {
    it('returns a user when one exists', async () => {
      const user = {
        id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'student',
      };
      userRepository.findOne.mockResolvedValue(user);

      await expect(service.findById('user-1')).resolves.toBe(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('returns all users ordered by newest first', async () => {
      const users = [{ id: 'user-1' }, { id: 'user-2' }];
      userRepository.find.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toBe(users);
      expect(userRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateRole', () => {
    it('promotes a student to admin', async () => {
      const user = { id: 'user-1', role: 'student' };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockImplementation(async (u) => ({ ...u }));

      await service.updateRole('user-1', 'admin', 'admin-1');

      expect(user.role).toBe('admin');
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('demotes a different admin to student', async () => {
      const user = { id: 'user-1', role: 'admin' };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockImplementation(async (u) => ({ ...u }));

      await service.updateRole('user-1', 'student', 'admin-2');

      expect(user.role).toBe('student');
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('rejects an invalid role with BadRequestException', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'user-1', role: 'admin' });

      await expect(
        service.updateRole('user-1', 'superuser' as never, 'admin-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('prevents an admin from demoting their own role', async () => {
      const user = { id: 'admin-1', role: 'admin' };
      userRepository.findOne.mockResolvedValue(user);

      await expect(
        service.updateRole('admin-1', 'student', 'admin-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('allows an admin to re-affirm their own admin role', async () => {
      const user = { id: 'admin-1', role: 'admin' };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockImplementation(async (u) => ({ ...u }));

      await service.updateRole('admin-1', 'admin', 'admin-1');

      expect(user.role).toBe('admin');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateRole('missing', 'admin', 'admin-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
