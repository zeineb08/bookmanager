import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuthorDocument = Author & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Author {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  biography: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);