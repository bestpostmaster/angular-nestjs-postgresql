import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import type { Logger } from 'pino';
import { MESSENGER_LOGGER } from '../logging/logging.module.js';
import { HandlerRegistry } from './handler-registry.js';
import { createRedisConnection } from './redis.connection.js';
import { MESSENGER_QUEUE, MessageBus } from './message-bus.js';

/** Équivalent de `messenger:consume`. Démarré explicitement via `start()`. */
@Injectable()
export class MessengerWorker implements OnApplicationShutdown {
  private worker?: Worker;

  constructor(
    private readonly bus: MessageBus,
    private readonly registry: HandlerRegistry,
    private readonly config: ConfigService,
    @Inject(MESSENGER_LOGGER) private readonly logger: Logger,
  ) {}

  start(): void {
    this.worker = new Worker(MESSENGER_QUEUE, (job) => this.process(job), {
      connection: createRedisConnection(this.config),
      concurrency: Number(this.config.get('MESSENGER_CONCURRENCY', 5)),
    });
    this.worker.on('failed', (job, err) =>
      this.logger.error(
        {
          message: job?.name,
          jobId: job?.id,
          attempt: job?.attemptsMade,
          maxAttempts: job?.opts.attempts,
          err,
        },
        'Job failed',
      ),
    );
    this.worker.on('error', (err) =>
      this.logger.error({ err }, 'Worker error'),
    );
    this.logger.info('Consuming messages');
  }

  async process(job: Job): Promise<void> {
    this.logger.debug({ message: job.name, jobId: job.id }, 'Job received');
    const cls = this.registry.resolve(job.name);
    if (!cls) throw new Error(`Unknown message type "${job.name}"`);
    const message = Object.assign(Object.create(cls.prototype), job.data);
    await this.bus.handle(message);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }
}
