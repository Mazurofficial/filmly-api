import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { compareHash, hashValue } from './hash.util';
import { Tokens } from './tokens';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Tokens> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await hashValue(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, displayName: dto.displayName },
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await compareHash(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email);
  }

  private getJwtSecret(
    key: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET',
  ): string {
    const secret = process.env[key];
    if (!secret) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }
    return secret;
  }

  private async issueTokens(userId: string, email: string): Promise<Tokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      { secret: this.getJwtSecret('JWT_ACCESS_SECRET'), expiresIn: '15m' },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email },
      { secret: this.getJwtSecret('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }
}
