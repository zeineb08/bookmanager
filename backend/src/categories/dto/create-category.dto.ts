import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Programming' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}