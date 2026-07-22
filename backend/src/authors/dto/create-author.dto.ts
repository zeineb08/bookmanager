import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthorDto {
  @ApiProperty({ example: 'Robert C. Martin' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'American software engineer and author...' })
  @IsString()
  @IsOptional()
  biography?: string;
}