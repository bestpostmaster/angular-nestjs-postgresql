import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { HandlerRegistry } from './handler-registry.js';
import { MESSENGER_QUEUE, MessageBus } from './message-bus.js';
import { createRedisConnection } from './redis.connection.js';
import { MessengerWorker } from './messenger.worker.js';

@Global()
@Module({
  imports: [
    DiscoveryModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: createRedisConnection(config),
      }),
    }),
    BullModule.registerQueue({ name: MESSENGER_QUEUE }),
  ],
  providers: [HandlerRegistry, MessageBus, MessengerWorker],
  exports: [MessageBus, MessengerWorker],
})
export class MessengerModule {}
