import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from 'src/common/current-user.decorator';
import { UserDocument } from './user.schema';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserDocument,
  ) {
    if (user._id.toString() !== id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile');
    }
    if (user.role !== 'ADMIN' && updateUserDto.role) {
      delete updateUserDto.role;
    }
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    if (user._id.toString() !== id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own profile');
    }
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
