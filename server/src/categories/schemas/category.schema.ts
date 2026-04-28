import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  description: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
applySchemaTransform(CategorySchema);
