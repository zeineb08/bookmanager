import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'ADMIN', enum: ['ADMIN', 'MEMBER'] })
  @IsEnum(['ADMIN', 'MEMBER'])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 'CurrentPassword123' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'NewPassword123' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}
