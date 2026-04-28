import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Brand } from '../../brands/schemas/brand.schema';
import { Category } from '../../categories/schemas/category.schema';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductSpecification {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, trim: true })
  value: string;
}

const ProductSpecificationSchema =
  SchemaFactory.createForClass(ProductSpecification);

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Product {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: Number, default: null })
  oldPrice?: number | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Brand.name, required: true })
  brand: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  category: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [ProductSpecificationSchema], default: [] })
  specifications: ProductSpecification[];

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ default: false })
  isPopular: boolean;

  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
applySchemaTransform(ProductSchema);
