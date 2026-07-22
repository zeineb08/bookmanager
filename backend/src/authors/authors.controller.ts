import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Authors')
@Controller('authors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AuthorsController {
  constructor(private authorsService: AuthorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new author' })
  async create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all authors' })
  async findAll(@Query('search') search?: string) {
    return this.authorsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get author by ID' })
  async findOne(@Param('id') id: string) {
    return this.authorsService.findById(id);
  }
}