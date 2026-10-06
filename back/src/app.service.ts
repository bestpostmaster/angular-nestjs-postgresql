import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NestJS.12.0.1.API/Angular.22/PrimeNJ.21.1.0/postgres:17-alpine/Node.js.22/TypeScript.6.0.2';
  }
}
