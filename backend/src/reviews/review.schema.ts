import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Book' })
  bookId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
