import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HttpException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: getDataSourceToken(), useValue: { query } }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('reports ok when the database responds', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      database: 'ok',
    });
  });

  it('throws a 503 when the database is unreachable', async () => {
    query.mockRejectedValue(new Error('connection refused'));
    await expect(controller.check()).rejects.toBeInstanceOf(HttpException);
  });
});
