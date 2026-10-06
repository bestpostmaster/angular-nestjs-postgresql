import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { MessengerWorker } from './messenger/messenger.worker.js';

/** Point d'entrée du consommateur : `npm run messenger:consume`. */
async function bootstrap() {
  process.env.APP_LOG_NAME ??= 'worker';
  process.env.PROFILER_ENABLED ??= 'false'; // pas de requêtes HTTP à profiler
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.get(MessengerWorker).start();
}

void bootstrap();
