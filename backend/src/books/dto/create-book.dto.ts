import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'Clean Code' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Robert C. Martin' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  author: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ example: ['Programming', 'Technology'] })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ example: 'English' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ example: 'Physical' })
  @IsString()
  @IsOptional()
  @IsIn(['Physical', 'E-Book', 'Audio Book'])
  format?: string;

  @ApiProperty({ example: 'A handbook of agile software craftsmanship...' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: '978-0132350884' })
  @IsString()
  ISBN: string;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 2008 })
  @IsNumber()
  @IsOptional()
  publicationYear?: number;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  totalCopies: number;

  @ApiPropertyOptional({ example: 'Active' })
  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}