import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BorrowingsController } from './borrowings.controller';
import { BorrowingsService } from './borrowings.service';
import { Borrowing, BorrowingSchema } from './borrowing.schema';
import { Book, BookSchema } from '../books/book.schema';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Borrowing.name, schema: BorrowingSchema },
      { name: Book.name, schema: BookSchema },
    ]),
    BooksModule,
  ],
  controllers: [BorrowingsController],
  providers: [BorrowingsService],
  exports: [BorrowingsService],
})
export class BorrowingsModule {}
