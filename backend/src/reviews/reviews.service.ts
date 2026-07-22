import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './review.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto): Promise<ReviewDocument> {
    const review = await this.reviewModel.create({
      userId,
      ...createReviewDto,
    });
    return review;
  }

  async findByBook(bookId: string) {
    const reviews = await this.reviewModel
      .find({ bookId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    };
  }
}
