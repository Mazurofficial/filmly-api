import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { StatsService } from './stats.service';

class StatsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  topN?: number = 5;
}

@Controller('me/stats')
@UseGuards(AuthGuard('jwt'))
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  getMyStats(@CurrentUser() u: { userId: string }, @Query() q: StatsQueryDto) {
    return this.stats.getMyStats(u.userId, q.topN ?? 5);
  }
}
