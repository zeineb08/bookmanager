import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBorrowingDto {
  @ApiProperty({ example: 'book_id_here' })
  @IsString()
  bookId: string;
}
