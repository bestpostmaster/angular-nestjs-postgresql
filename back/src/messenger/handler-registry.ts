import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import {
  getHandledMessage,
  MessageHandlerInterface,
} from './message-handler.decorator.js';
import type { MessageClass } from './message.decorator.js';

/** Découvre les providers annotés `@MessageHandler` et les indexe par message. */
@Injectable()
export class HandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(HandlerRegistry.name);
  private readonly handlers = new Map<
    MessageClass,
    MessageHandlerInterface[]
  >();
  private readonly byName = new Map<string, MessageClass>();

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as MessageHandlerInterface | undefined;
      if (!instance || typeof instance !== 'object') continue;
      const message = getHandledMessage(instance);
      if (!message) continue;
      this.handlers.set(message, [
        ...(this.handlers.get(message) ?? []),
        instance,
      ]);
      this.byName.set(message.name, message);
      this.logger.log(`${instance.constructor.name} handles ${message.name}`);
    }
  }

  getHandlers(message: object): MessageHandlerInterface[] {
    return this.handlers.get(message.constructor as MessageClass) ?? [];
  }

  resolve(name: string): MessageClass | undefined {
    return this.byName.get(name);
  }
}
