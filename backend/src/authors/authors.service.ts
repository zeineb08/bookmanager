import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Author, AuthorDocument } from './author.schema';
import { CreateAuthorDto } from './dto/create-author.dto';
import { escapeRegExp } from '../common/escape-regex.util';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDocument> {
    const safeName = escapeRegExp(createAuthorDto.name);
    const existing = await this.authorModel.findOne({ name: { $regex: new RegExp(`^${safeName}$`, 'i') } });
    if (existing) {
      throw new ConflictException('Author already exists');
    }
    return this.authorModel.create(createAuthorDto);
  }

  async findAll(search?: string): Promise<AuthorDocument[]> {
    const query: any = {};
    if (search) {
      query.name = { $regex: escapeRegExp(search), $options: 'i' };
    }
    return this.authorModel.find(query).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<AuthorDocument> {
    const author = await this.authorModel.findById(id);
    if (!author) throw new NotFoundException('Author not found');
    return author;
  }
}