import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { WatchStatus } from './add-to-library.dto';

export class LibraryQueryDto {
  @IsOptional()
  @IsEnum(WatchStatus)
  status?: WatchStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  genreId?: number; // TMDb genre id
}
