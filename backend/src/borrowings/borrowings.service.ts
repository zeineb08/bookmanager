import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Borrowing, BorrowingDocument } from './borrowing.schema';
import { Book, BookDocument } from '../books/book.schema';
import { CreateBorrowingDto } from './dto/create-borrowing.dto';
import { UserDocument } from '../users/user.schema';

@Injectable()
export class BorrowingsService {
  constructor(
    @InjectModel(Borrowing.name) private borrowingModel: Model<BorrowingDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async borrow(userId: string, createBorrowingDto: CreateBorrowingDto) {
    const { bookId } = createBorrowingDto;

    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException('No copies available for borrowing');
    }

    // Check if user already has this book borrowed
    const existingBorrowing = await this.borrowingModel.findOne({
      userId,
      bookId,
      status: 'BORROWED',
    });

    if (existingBorrowing) {
      throw new BadRequestException('You have already borrowed this book');
    }

    const borrowing = await this.borrowingModel.create({
      userId,
      bookId,
      borrowDate: new Date(),
      status: 'BORROWED',
    });

    await this.bookModel.findByIdAndUpdate(bookId, {
      $inc: { availableCopies: -1 },
    });

    return borrowing;
  }

  async returnBook(borrowingId: string, user: UserDocument) {
    const borrowing = await this.borrowingModel.findById(borrowingId);
    if (!borrowing) {
      throw new NotFoundException('Borrowing record not found');
    }

    if (user.role !== 'ADMIN' && borrowing.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only return your own borrowings');
    }

    if (borrowing.status === 'RETURNED') {
      throw new BadRequestException('Book has already been returned');
    }

    const borrowDate = new Date(borrowing.borrowDate);
    const returnDate = new Date();
    const diffDays = Math.floor(
      (returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    borrowing.returnDate = returnDate;
    borrowing.status = diffDays > 14 ? 'LATE' : 'RETURNED';
    await borrowing.save();

    await this.bookModel.findByIdAndUpdate(borrowing.bookId, {
      $inc: { availableCopies: 1 },
    });

    return borrowing;
  }

  async findAll() {
    const borrowings = await this.borrowingModel
      .find()
      .populate('userId', 'name email')
      .populate('bookId', 'title author ISBN coverImage')
      .sort({ createdAt: -1 })
      .exec();

    return borrowings;
  }

  async findByUser(userId: string) {
    const borrowings = await this.borrowingModel
      .find({ userId })
      .populate('bookId', 'title author ISBN coverImage category')
      .sort({ createdAt: -1 })
      .exec();

    return borrowings;
  }

  async getActiveBorrowings() {
    return this.borrowingModel.countDocuments({ status: 'BORROWED' });
  }

  async getLateReturns() {
    const lateThreshold = new Date();
    lateThreshold.setDate(lateThreshold.getDate() - 14);
    return this.borrowingModel.countDocuments({
      borrowDate: { $lte: lateThreshold },
      status: 'BORROWED',
    });
  }

  async getMonthlyStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyBorrowings = await this.borrowingModel.countDocuments({
      borrowDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthlyReturns = await this.borrowingModel.countDocuments({
      returnDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['RETURNED', 'LATE'] },
    });

    return { monthlyBorrowings, monthlyReturns };
  }
}
