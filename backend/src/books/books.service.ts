import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { escapeRegExp } from '../common/escape-regex.util';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<BookDocument> {
    const book = await this.bookModel.create({
      ...createBookDto,
      availableCopies: createBookDto.totalCopies,
    });
    return book;
  }

  async findAll(queryDto: QueryBookDto) {
    const {
      search,
      category,
      author,
      minYear,
      maxYear,
      page = 1,
      limit = 12,
    } = queryDto;

    const query: any = {};

    if (search) {
      const safeSearch = escapeRegExp(search);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { author: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (author) {
      query.author = { $regex: escapeRegExp(author), $options: 'i' };
    }

    if (minYear || maxYear) {
      query.publicationYear = {};
      if (minYear) query.publicationYear.$gte = minYear;
      if (maxYear) query.publicationYear.$lte = maxYear;
    }

    const skip = (page - 1) * limit;
    const total = await this.bookModel.countDocuments(query);
    const books = await this.bookModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      books,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  async findById(id: string): Promise<BookDocument> {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<BookDocument> {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const updateData: any = { ...updateBookDto };

    if (updateBookDto.totalCopies !== undefined) {
      const diff = updateBookDto.totalCopies - book.totalCopies;
      const newAvailable = book.availableCopies + diff;
      updateData.availableCopies = newAvailable < 0 ? 0 : newAvailable;
    }

    const updated = await this.bookModel
      .findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updated) {
      throw new NotFoundException('Book not found after update');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.bookModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Book not found');
    }
  }

  async getCategories(): Promise<string[]> {
    return this.bookModel.distinct('category').exec();
  }
}
