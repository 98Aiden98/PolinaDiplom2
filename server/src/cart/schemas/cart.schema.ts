import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, unique: true, required: true })
  userId: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
applySchemaTransform(CartSchema);
