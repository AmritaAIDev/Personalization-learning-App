import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateDoubtDto, CreateDoubtThreadDto } from './doubts.dto';
import { DoubtsService } from './doubts.service';

@ApiTags('Doubts')
@Controller('api/doubts')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class DoubtsController {
  constructor(private readonly doubtsService: DoubtsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.doubtsService.list(user.id),
    };
  }

  @Post()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDoubtDto,
  ) {
    return {
      data: await this.doubtsService.create(user.id, body),
    };
  }

  /** One-tap re-queue of an offline fallback answer. */
  @Post(':id/retry')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  async retry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      data: await this.doubtsService.retry(user.id, id),
    };
  }

  /**
   * Server-Sent Events variant of {@link create}: emits `start` (the created
   * doubt card), `chunk` events as the tutor generates text, then one `done`
   * event with the persisted card — or `error` if creation itself failed.
   * Generation and persistence continue even if the client disconnects, so
   * the polling path stays correct as a fallback. Same fetch + stream-reader
   * convention as the learning tutor stream.
   */
  @Post('stream')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async createStream(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDoubtDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Writes must never abort generation: a gone client just stops receiving.
    const send = (event: string, data: unknown) => {
      if (req.aborted || res.writableEnded) return;
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        /* client hung up; keep resolving server-side */
      }
    };

    try {
      const doubt = await this.doubtsService.createForStreaming(user.id, body);
      send('start', { doubt: this.doubtsService.toCard(doubt) });
      const card = await this.doubtsService.respondToDoubtStreaming(
        doubt,
        (text) => send('chunk', { content: text }),
      );
      send('done', { doubt: card });
    } catch (error) {
      send('error', {
        message:
          error instanceof Error
            ? error.message
            : 'The AI tutor is currently unavailable.',
      });
    } finally {
      res.end();
    }
  }

  @Post('threads')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async createThread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDoubtThreadDto,
  ) {
    return {
      data: await this.doubtsService.createThread(user.id, body),
    };
  }
}
