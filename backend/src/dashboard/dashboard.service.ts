import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import { Book } from '../books/book.schema';
import { Borrowing } from '../borrowings/borrowing.schema';
import { Review } from '../reviews/review.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(Borrowing.name) private borrowingModel: Model<Borrowing>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
  ) {}

  async getStats() {
    const totalBooks = await this.bookModel.countDocuments();
    const totalUsers = await this.userModel.countDocuments();
    const activeBorrowings = await this.borrowingModel.countDocuments({
      status: 'BORROWED',
    });
    const returnedBooks = await this.borrowingModel.countDocuments({
      status: { $in: ['RETURNED', 'LATE'] },
    });
    const lateReturns = await this.borrowingModel.countDocuments({
      status: 'LATE',
    });

    // Books by category
    const booksByCategory = await this.bookModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Most borrowed books
    const mostBorrowed = await this.borrowingModel.aggregate([
      { $group: { _id: '$bookId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      {
        $project: {
          title: '$book.title',
          author: '$book.author',
          count: 1,
        },
      },
    ]);

    // Recent users
    const recentUsers = await this.userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Recent borrowings
    const recentBorrowings = await this.borrowingModel
      .find()
      .populate('userId', 'name email')
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Monthly stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyBorrowings = await this.borrowingModel.countDocuments({
      borrowDate: { $gte: startOfMonth },
    });

    const monthlyReturns = await this.borrowingModel.countDocuments({
      returnDate: { $gte: startOfMonth },
    });

    return {
      totalBooks,
      totalUsers,
      activeBorrowings,
      returnedBooks,
      lateReturns,
      booksByCategory: booksByCategory.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      mostBorrowed,
      recentUsers,
      recentBorrowings,
      monthlyBorrowings,
      monthlyReturns,
    };
  }
}
