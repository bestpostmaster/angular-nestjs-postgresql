import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('status')
export class StatusController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  getStatus(): { environment: string } {
    return {
      environment: this.config.get<string>('NODE_ENV', 'development'),
    };
  }
}
