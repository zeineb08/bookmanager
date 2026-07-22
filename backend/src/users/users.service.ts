import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: UserDocument): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = { ...updateUserDto };
    
    if (updateUserDto.password) {
      if (currentUser && currentUser.role !== 'ADMIN') {
        if (!updateUserDto.currentPassword) {
          throw new BadRequestException('currentPassword is required to change password');
        }
        const isPasswordValid = await bcrypt.compare(updateUserDto.currentPassword, user.password);
        if (!isPasswordValid) {
          throw new BadRequestException('Invalid current password');
        }
      }
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    delete updateData.currentPassword;

    const updated = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password');

    if (!updated) {
      throw new NotFoundException('User not found after update');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
