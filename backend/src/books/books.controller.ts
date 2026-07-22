import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all books with filtering and pagination' })
  async findAll(@Query() queryDto: QueryBookDto) {
    return this.booksService.findAll(queryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all book categories' })
  async getCategories() {
    return this.booksService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  async findOne(@Param('id') id: string) {
    return this.booksService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new book (Admin only)' })
  async create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a book (Admin only)' })
  async update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.booksService.remove(id);
    return { message: 'Book deleted successfully' };
  }
}
