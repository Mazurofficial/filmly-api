import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export enum WatchStatus {
  WATCHED = 'watched',
  PLANNED = 'planned',
}

export class AddToLibraryDto {
  @IsInt()
  @IsPositive()
  tmdbId!: number;

  @IsEnum(WatchStatus)
  status!: WatchStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  watchCount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
