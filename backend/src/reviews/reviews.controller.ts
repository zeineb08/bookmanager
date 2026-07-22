import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UserDocument } from '../users/user.schema';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  async create(
    @CurrentUser() user: UserDocument,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user._id.toString(), createReviewDto);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get all reviews for a book' })
  async findByBook(@Param('bookId') bookId: string) {
    return this.reviewsService.findByBook(bookId);
  }
}
