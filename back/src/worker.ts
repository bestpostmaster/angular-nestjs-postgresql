import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MessengerWorker } from './messenger/messenger.worker.js';

/** Point d'entrée du consommateur : `npm run messenger:consume`. */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  app.get(MessengerWorker).start();
}

void bootstrap();
