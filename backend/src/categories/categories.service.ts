import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { escapeRegExp } from '../common/escape-regex.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
    const safeName = escapeRegExp(createCategoryDto.name);
    const existing = await this.categoryModel.findOne({ name: { $regex: new RegExp(`^${safeName}$`, 'i') } });
    if (existing) {
      throw new ConflictException('Category already exists');
    }
    return this.categoryModel.create(createCategoryDto);
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().sort({ name: 1 }).exec();
  }
}