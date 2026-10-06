import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import {
  appTargets,
  messengerTargets,
  readLogSettings,
} from './log-targets.js';

export const MESSENGER_LOGGER = Symbol('MESSENGER_LOGGER');

/**
 * Logs structurés (pino) : console + fichiers dans `LOG_DIR` (défaut `logs/`).
 * Le nom du fichier applicatif vient de `APP_LOG_NAME` (`app` pour l'API, `worker` pour le consommateur).
 */
@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const settings = readLogSettings(config);
        return {
          pinoHttp: {
            level: settings.level,
            transport: {
              targets: appTargets(settings, config.get('APP_LOG_NAME', 'app')),
            },
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
        };
      },
    }),
  ],
  providers: [
    {
      provide: MESSENGER_LOGGER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const settings = readLogSettings(config);
        return pino(
          { level: settings.level, base: { channel: 'messenger' } },
          pino.transport({ targets: messengerTargets(settings) }),
        );
      },
    },
  ],
  exports: [MESSENGER_LOGGER],
})
export class LoggingModule {}
