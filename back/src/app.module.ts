import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { buildDataSourceOptions } from './database/database.config.js';
import { LoggingModule } from './logging/logging.module.js';
import { MessengerModule } from './messenger/messenger.module.js';
import { StatusController } from './status/status.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDataSourceOptions({
          DB_HOST: config.get('DB_HOST'),
          DB_PORT: config.get('DB_PORT'),
          DB_USER: config.get('DB_USER'),
          DB_PASSWORD: config.get('DB_PASSWORD'),
          DB_NAME: config.get('DB_NAME'),
        }),
        migrationsRun: true,
      }),
    }),
    LoggingModule,
    MessengerModule,
    AuthModule,
  ],
  controllers: [AppController, StatusController],
  providers: [AppService],
})
export class AppModule {}
