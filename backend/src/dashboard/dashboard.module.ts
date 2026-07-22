import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User, UserSchema } from '../users/user.schema';
import { Book, BookSchema } from '../books/book.schema';
import { Borrowing, BorrowingSchema } from '../borrowings/borrowing.schema';
import { Review, ReviewSchema } from '../reviews/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
      { name: Borrowing.name, schema: BorrowingSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
