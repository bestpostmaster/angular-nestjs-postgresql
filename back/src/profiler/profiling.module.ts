import { ProfilerModule } from '@eleven-labs/nest-profiler';
import { TypeOrmCollectorModule } from '@eleven-labs/nest-profiler-typeorm';
import { DynamicModule, Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';

/**
 * Le profiler n'est actif qu'en développement (`NODE_ENV=development`).
 * `PROFILER_ENABLED=false` permet de le couper explicitement (ex. le worker).
 * Hors de ces conditions, le module n'est jamais chargé : aucun coût en production.
 */
export const isProfilerEnabled = (env: NodeJS.ProcessEnv): boolean =>
  env['NODE_ENV'] === 'development' && env['PROFILER_ENABLED'] !== 'false';

@Module({})
class ProfilingModule {
  static forRoot(): DynamicModule {
    return {
      module: ProfilingModule,
      imports: [
        ProfilerModule.forRoot({ isGlobal: true, maxProfiles: 100 }),
        TypeOrmCollectorModule.forRoot(),
      ],
    };
  }
}

export const profilingModule = ConditionalModule.registerWhen(
  ProfilingModule.forRoot(),
  isProfilerEnabled,
);
