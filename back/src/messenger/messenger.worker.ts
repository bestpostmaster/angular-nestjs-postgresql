import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { HandlerRegistry } from './handler-registry.js';
import { createRedisConnection } from './redis.connection.js';
import { MESSENGER_QUEUE, MessageBus } from './message-bus.js';

/** Équivalent de `messenger:consume`. Démarré explicitement via `start()`. */
@Injectable()
export class MessengerWorker implements OnApplicationShutdown {
  private readonly logger = new Logger(MessengerWorker.name);
  private worker?: Worker;

  constructor(
    private readonly bus: MessageBus,
    private readonly registry: HandlerRegistry,
    private readonly config: ConfigService,
  ) {}

  start(): void {
    this.worker = new Worker(MESSENGER_QUEUE, (job) => this.process(job), {
      connection: createRedisConnection(this.config),
      concurrency: Number(this.config.get('MESSENGER_CONCURRENCY', 5)),
    });
    this.worker.on('failed', (job, error) =>
      this.logger.error(
        `${job?.name} #${job?.id} failed (attempt ${job?.attemptsMade}): ${error.message}`,
      ),
    );
    this.logger.log('Consuming messages...');
  }

  async process(job: Job): Promise<void> {
    const cls = this.registry.resolve(job.name);
    if (!cls) throw new Error(`Unknown message type "${job.name}"`);
    const message = Object.assign(Object.create(cls.prototype), job.data);
    await this.bus.handle(message);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }
}
