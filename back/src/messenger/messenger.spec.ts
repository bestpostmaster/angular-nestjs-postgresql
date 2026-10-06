import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { DiscoveryModule } from '@nestjs/core';
import { HandlerRegistry } from './handler-registry.js';
import { MESSENGER_QUEUE, MessageBus } from './message-bus.js';
import { MessageHandler } from './message-handler.decorator.js';
import { Message } from './message.decorator.js';
import { MessengerWorker } from './messenger.worker.js';

class Ping {
  constructor(public readonly text: string) {}
}

@Message({ transport: 'async', attempts: 5 })
class SlowPing {
  constructor(public readonly text: string) {}
}

const received: object[] = [];

@MessageHandler(Ping)
class PingHandler {
  handle(message: Ping) {
    received.push(message);
    return message.text.toUpperCase();
  }
}

@MessageHandler(SlowPing)
class SlowPingHandler {
  handle(message: SlowPing) {
    received.push(message);
  }
}

describe('Messenger', () => {
  const queue = { add: vi.fn().mockResolvedValue({ id: '42' }) };
  let bus: MessageBus;
  let worker: MessengerWorker;

  beforeEach(async () => {
    received.length = 0;
    queue.add.mockClear();
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        HandlerRegistry,
        MessageBus,
        PingHandler,
        SlowPingHandler,
        { provide: getQueueToken(MESSENGER_QUEUE), useValue: queue },
        {
          provide: MessengerWorker,
          useFactory: (b: MessageBus, r: HandlerRegistry) =>
            new MessengerWorker(b, r, {} as never),
          inject: [MessageBus, HandlerRegistry],
        },
      ],
    }).compile();
    await moduleRef.init();
    bus = moduleRef.get(MessageBus);
    worker = moduleRef.get(MessengerWorker);
  });

  it('handles sync messages immediately', async () => {
    expect(await bus.dispatch(new Ping('hi'))).toEqual(['HI']);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('enqueues async messages with their retry options', async () => {
    expect(await bus.dispatch(new SlowPing('later'), { delayMs: 500 })).toBe(
      '42',
    );
    expect(queue.add).toHaveBeenCalledWith(
      'SlowPing',
      { text: 'later' },
      expect.objectContaining({ attempts: 5, delay: 500 }),
    );
    expect(received).toHaveLength(0);
  });

  it('rehydrates the message in the worker', async () => {
    await worker.process({
      name: 'SlowPing',
      data: { text: 'later' },
    } as never);
    expect(received[0]).toBeInstanceOf(SlowPing);
    expect(received[0]).toMatchObject({ text: 'later' });
  });

  it('rejects messages without handler', async () => {
    await expect(bus.dispatch(new (class Orphan {})())).rejects.toThrow(
      'No handler',
    );
  });
});
