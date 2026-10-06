import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableCors({ origin: process.env.FRONT_URL ?? 'http://localhost:4200' });
  await app.listen(process.env.PORT ?? 3002);
}
await bootstrap();
