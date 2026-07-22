import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryBookDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minYear?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxYear?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
