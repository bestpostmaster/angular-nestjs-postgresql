import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { Logger } from 'pino';
import { MESSENGER_LOGGER } from '../logging/logging.module.js';
import { HandlerRegistry } from './handler-registry.js';
import { getMessageOptions, MessageClass } from './message.decorator.js';

export const MESSENGER_QUEUE = 'messenger';

export interface DispatchOptions {
  /** Retarde le traitement (async uniquement) — équivalent de DelayStamp. */
  delayMs?: number;
  /** Force le transport, en ignorant celui déclaré par `@Message`. */
  transport?: 'sync' | 'async';
}

/** Équivalent de `MessageBusInterface`. */
@Injectable()
export class MessageBus {
  constructor(
    private readonly registry: HandlerRegistry,
    @InjectQueue(MESSENGER_QUEUE) private readonly queue: Queue,
    @Inject(MESSENGER_LOGGER) private readonly logger: Logger,
  ) {}

  /**
   * Sync : exécute les handlers et renvoie leurs résultats.
   * Async : enfile le message et renvoie l'id du job.
   */
  async dispatch(
    message: object,
    options: DispatchOptions = {},
  ): Promise<unknown[] | string> {
    const cls = message.constructor as MessageClass;
    const config = getMessageOptions(cls);
    const transport = options.transport ?? config.transport;

    if (transport === 'async') {
      const job = await this.queue.add(
        cls.name,
        { ...message },
        {
          attempts: config.attempts,
          backoff: { type: 'exponential', delay: config.backoffMs },
          delay: options.delayMs,
          removeOnComplete: true,
          removeOnFail: false, // les échecs définitifs restent consultables (failure transport)
        },
      );
      this.logger.info(
        { message: cls.name, jobId: job.id, delayMs: options.delayMs },
        'Message queued',
      );
      return job.id!;
    }

    return this.handle(message);
  }

  /** Exécute les handlers ; utilisé en sync et par le worker. */
  async handle(message: object): Promise<unknown[]> {
    const name = message.constructor.name;
    const handlers = this.registry.getHandlers(message);
    if (handlers.length === 0) {
      this.logger.error({ message: name }, 'No handler for message');
      throw new Error(`No handler for message ${name}`);
    }
    const start = performance.now();
    try {
      const results = await Promise.all(
        handlers.map((handler) => handler.handle(message)),
      );
      this.logger.info(
        { message: name, durationMs: Math.round(performance.now() - start) },
        'Message handled',
      );
      return results;
    } catch (err) {
      this.logger.error({ message: name, err }, 'Message handling failed');
      throw err;
    }
  }
}
