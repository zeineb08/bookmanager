import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BorrowingsService } from './borrowings.service';
import { CreateBorrowingDto } from './dto/create-borrowing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { UserDocument } from '../users/user.schema';

@ApiTags('Borrowings')
@Controller('borrowings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BorrowingsController {
  constructor(private borrowingsService: BorrowingsService) {}

  @Post()
  @ApiOperation({ summary: 'Borrow a book' })
  async borrow(
    @CurrentUser() user: UserDocument,
    @Body() createBorrowingDto: CreateBorrowingDto,
  ) {
    return this.borrowingsService.borrow(user._id.toString(), createBorrowingDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all borrowings (Admin only)' })
  async findAll() {
    return this.borrowingsService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get borrowings by user' })
  async findByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: UserDocument,
  ) {
    if (user.role !== 'ADMIN' && user._id.toString() !== userId) {
      throw new ForbiddenException('You can only view your own borrowings');
    }
    return this.borrowingsService.findByUser(userId);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Return a borrowed book' })
  async returnBook(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.borrowingsService.returnBook(id, user);
  }
}
