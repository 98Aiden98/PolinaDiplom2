import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type EmailNotificationDocument = HydratedDocument<EmailNotification>;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class EmailNotification {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    default: null,
  })
  userId?: Types.ObjectId | null;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ enum: ['pending', 'sent', 'failed'], default: 'pending' })
  status: 'pending' | 'sent' | 'failed';

  createdAt: Date;
}

export const EmailNotificationSchema =
  SchemaFactory.createForClass(EmailNotification);
applySchemaTransform(EmailNotificationSchema);
