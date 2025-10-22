import {
  ConflictException,
  ForbiddenException,
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

    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(dto: LoginDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await compareHash(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    type RefreshPayload = { sub: string; email: string; exp?: number };

    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.getJwtSecret('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        refreshTokenHash: true,
        refreshTokenExp: true,
      },
    });
    if (!user?.refreshTokenHash) {
      throw new ForbiddenException('Refresh revoked');
    }

    const match = await compareHash(refreshToken, user.refreshTokenHash);
    if (!match) {
      throw new ForbiddenException('Refresh mismatch');
    }

    if (user.refreshTokenExp && user.refreshTokenExp.getTime() < Date.now()) {
      throw new ForbiddenException('Refresh expired');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<{ ok: true }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null, refreshTokenExp: null },
    });
    return { ok: true };
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

  private async saveRefresh(
    userId: string,
    refreshTokenPlain: string,
  ): Promise<void> {
    const refreshHash = await hashValue(refreshTokenPlain);

    const decodedRaw: unknown = this.jwt.decode(refreshTokenPlain);
    let expDate: Date | null = null;
    if (
      decodedRaw &&
      typeof decodedRaw === 'object' &&
      'exp' in decodedRaw &&
      typeof (decodedRaw as { exp: unknown }).exp === 'number'
    ) {
      expDate = new Date((decodedRaw as { exp: number }).exp * 1000);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: refreshHash,
        refreshTokenExp: expDate,
      },
    });
  }
}
