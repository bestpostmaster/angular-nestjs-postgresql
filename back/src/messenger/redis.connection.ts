import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/** BullMQ n'embarque plus ioredis et, en ESM, exige une instance déjà construite. */
export function createRedisConnection(config: ConfigService): Redis {
  return new Redis({
    host: config.get('REDIS_HOST', 'localhost'),
    port: Number(config.get('REDIS_PORT', 6379)),
    maxRetriesPerRequest: null, // requis par BullMQ pour les workers
  });
}
