import { IsString, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'book_id_here' })
  @IsString()
  bookId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great book! Highly recommended.' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  comment: string;
}
