import 'reflect-metadata';

export type MessageClass<T extends object = object> = new (...args: any[]) => T;

export interface MessageOptions {
  /** `sync` (défaut) : traité immédiatement. `async` : envoyé dans la file Redis. */
  transport?: 'sync' | 'async';
  /** Nombre maximum de tentatives en transport async (défaut : 3). */
  attempts?: number;
  /** Délai de base du backoff exponentiel en ms (défaut : 1000). */
  backoffMs?: number;
}

const MESSAGE_OPTIONS = Symbol('messenger:message');

/** Équivalent de `#[AsMessage]` + routing : déclare le transport d'un message. */
export function Message(options: MessageOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(MESSAGE_OPTIONS, options, target);
  };
}

export function getMessageOptions(cls: MessageClass): Required<MessageOptions> {
  const options: MessageOptions =
    Reflect.getMetadata(MESSAGE_OPTIONS, cls) ?? {};
  return {
    transport: options.transport ?? 'sync',
    attempts: options.attempts ?? 3,
    backoffMs: options.backoffMs ?? 1000,
  };
}
