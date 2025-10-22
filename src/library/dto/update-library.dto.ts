import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { WatchStatus } from './add-to-library.dto';

export class UpdateLibraryDto {
  @IsOptional()
  @IsEnum(WatchStatus)
  status?: WatchStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  watchCount?: number;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsString()
  lastWatchedAt?: string | null; // ISO string, convert to Date in service
}
