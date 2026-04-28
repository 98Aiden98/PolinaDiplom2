import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Brand {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  slug: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
applySchemaTransform(BrandSchema);
