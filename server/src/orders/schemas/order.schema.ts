import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { User } from '../../users/schemas/user.schema';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 1 })
  quantity: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({ enum: Object.values(OrderStatus), default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true })
  deliveryAddress: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: '' })
  comment: string;

  createdAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
applySchemaTransform(OrderSchema);
