import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.users.findOne({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
    const valid =
      !!user?.passwordHash && (await compare(password, user.passwordHash));
    if (!user || !valid) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const access_token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return { access_token };
  }
}
