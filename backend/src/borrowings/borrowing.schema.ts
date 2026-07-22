import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type BorrowingDocument = Borrowing & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Borrowing {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Book' })
  bookId: string;

  @Prop({ required: true, default: Date.now })
  borrowDate: Date;

  @Prop()
  returnDate: Date;

  @Prop({ required: true, enum: ['BORROWED', 'RETURNED', 'LATE'], default: 'BORROWED' })
  status: string;
}

export const BorrowingSchema = SchemaFactory.createForClass(Borrowing);
