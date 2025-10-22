import {
  Controller,
  Get,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() user: { userId: string; email: string } | undefined) {
    if (!user) {
      throw new UnauthorizedException();
    }
    const me = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return me;
  }
}
