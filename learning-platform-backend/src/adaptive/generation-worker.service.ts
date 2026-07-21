import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { AdaptiveContentService } from './adaptive-content.service';
import { GenerationJob } from './generation-job.entity';

/**
 * A small durable database worker. Jobs survive a web-process restart and are
 * claimed with a row lock, so multiple application instances do not generate
 * the same pool concurrently.
 */
@Injectable()
export class GenerationWorkerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(GenerationWorkerService.name);
  private interval: NodeJS.Timeout | null = null;
  private draining = false;

  constructor(private readonly contentService: AdaptiveContentService) {}

  onModuleInit(): void {
    this.interval = setInterval(() => void this.drain(), 15_000);
    this.interval.unref();
    void this.drain();
  }

  onApplicationShutdown(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  async processNow(jobId: string): Promise<void> {
    const job = await this.contentService.claimJob(jobId);
    if (!job) return;
    await this.processClaimedJob(job);
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      // A bounded drain protects the web process when a long backlog exists.
      for (let count = 0; count < 3; count += 1) {
        const job = await this.contentService.claimNextJob();
        if (!job) return;
        await this.processClaimedJob(job);
      }
    } catch (error) {
      this.logger.error('Generation worker drain failed', error as Error);
    } finally {
      this.draining = false;
    }
  }

  private async processClaimedJob(job: GenerationJob): Promise<void> {
    try {
      await this.contentService.generateForJob(job);
    } catch (error) {
      await this.contentService.markJobFailed(job, error);
    }
  }
}
