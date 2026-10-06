import { ConfigService } from '@nestjs/config';
import type { TransportTargetOptions } from 'pino';

export interface LogSettings {
  level: string;
  dir: string;
  production: boolean;
}

export function readLogSettings(config: ConfigService): LogSettings {
  const production = config.get('NODE_ENV') === 'production';
  return {
    level: config.get('LOG_LEVEL', production ? 'info' : 'debug'),
    dir: config.get('LOG_DIR', 'logs'),
    production,
  };
}

/** Fichier tournant quotidiennement : `<dir>/<name>.<yyyy-MM-dd>.log`, 14 jours conservés. */
function fileTarget(
  settings: LogSettings,
  name: string,
  level?: string,
): TransportTargetOptions {
  return {
    target: 'pino-roll',
    level: level ?? settings.level,
    options: {
      file: `${settings.dir}/${name}`,
      extension: '.log',
      frequency: 'daily',
      dateFormat: 'yyyy-MM-dd',
      mkdir: true,
      limit: { count: 14 },
    },
  };
}

function consoleTarget(settings: LogSettings): TransportTargetOptions {
  return settings.production
    ? {
        target: 'pino/file',
        level: settings.level,
        options: { destination: 1 },
      }
    : {
        target: 'pino-pretty',
        level: settings.level,
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:HH:MM:ss.l',
        },
      };
}

/** Application : console + `<name>.log` (tout) + `<name>-error.log` (erreurs). */
export function appTargets(
  settings: LogSettings,
  name: string,
): TransportTargetOptions[] {
  return [
    consoleTarget(settings),
    fileTarget(settings, name),
    fileTarget(settings, `${name}-error`, 'error'),
  ];
}

/** Messenger : console + `messenger.log`. */
export function messengerTargets(
  settings: LogSettings,
): TransportTargetOptions[] {
  return [consoleTarget(settings), fileTarget(settings, 'messenger')];
}
