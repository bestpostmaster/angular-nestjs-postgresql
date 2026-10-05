import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

export function buildDataSourceOptions(env: NodeJS.ProcessEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities: [join(import.meta.dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(import.meta.dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
  };
}
