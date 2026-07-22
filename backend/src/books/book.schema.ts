import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type BookDocument = Book & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ required: true, trim: true, index: true })
  author: string;

  @Prop()
  authorId: string;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ default: 'English' })
  language: string;

  @Prop({ default: 'Physical' })
  format: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, unique: true })
  ISBN: string;

  @Prop({ index: true })
  category: string;

  @Prop()
  publicationYear: number;

  @Prop()
  coverImage: string;

  @Prop({ default: 'Active' })
  status: string;

  @Prop({ required: true, default: 1, min: 0 })
  totalCopies: number;

  @Prop({ required: true, default: 1, min: 0 })
  availableCopies: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);