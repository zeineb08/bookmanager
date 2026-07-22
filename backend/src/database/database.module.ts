import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';
import { Book, BookSchema } from '../books/book.schema';
import { Borrowing, BorrowingSchema } from '../borrowings/borrowing.schema';
import { Review, ReviewSchema } from '../reviews/review.schema';
import { Author, AuthorSchema } from '../authors/author.schema';
import { Category, CategorySchema } from '../categories/category.schema';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
      { name: Borrowing.name, schema: BorrowingSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}