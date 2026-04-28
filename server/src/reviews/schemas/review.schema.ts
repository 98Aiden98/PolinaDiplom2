import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true, minlength: 5, maxlength: 120 })
  title: string;

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 1500 })
  comment: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

applySchemaTransform(ReviewSchema);
