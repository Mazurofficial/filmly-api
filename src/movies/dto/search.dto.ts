import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class SearchDto {
  @IsString()
  @MinLength(1)
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;
}
