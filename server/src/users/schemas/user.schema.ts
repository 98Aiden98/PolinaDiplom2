import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { applySchemaTransform } from '../../common/utils/schema-transform.util';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ enum: Object.values(Role), default: Role.USER })
  role: Role;

  @Prop({ default: '' })
  address: string;

  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
applySchemaTransform(UserSchema);
