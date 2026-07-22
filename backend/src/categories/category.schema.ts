import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);