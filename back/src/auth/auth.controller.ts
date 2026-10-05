import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: { email?: unknown; password?: unknown }) {
    const { email, password } = body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new BadRequestException('email et password sont requis');
    }
    return this.auth.login(email, password);
  }
}
