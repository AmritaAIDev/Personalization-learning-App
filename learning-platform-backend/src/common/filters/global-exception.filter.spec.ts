import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

function mockHost(request: object) {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('GlobalExceptionFilter', () => {
  it('preserves status and body for a known HttpException', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = mockHost({
      id: 'req-1',
      method: 'GET',
      url: '/x',
    });

    filter.catch(new BadRequestException('bad input'), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'bad input', requestId: 'req-1' }),
    );
  });

  it('masks unknown errors as an opaque 500', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = mockHost({
      id: 'req-2',
      method: 'GET',
      url: '/y',
    });

    filter.catch(new Error('leaky internal detail'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal server error',
        requestId: 'req-2',
      }),
    );
  });
});
