import { Injectable } from '@nestjs/common';
import 'reflect-metadata';
import type { MessageClass } from './message.decorator.js';

export interface MessageHandlerInterface<T extends object = object> {
  handle(message: T): unknown;
}

const HANDLER_FOR = Symbol('messenger:handler-for');

/** Équivalent de `#[AsMessageHandler]` : la classe doit exposer `handle(message)`. */
export function MessageHandler(message: MessageClass): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(HANDLER_FOR, message, target);
    Injectable()(target);
  };
}

export function getHandledMessage(handler: object): MessageClass | undefined {
  return Reflect.getMetadata(HANDLER_FOR, handler.constructor);
}
