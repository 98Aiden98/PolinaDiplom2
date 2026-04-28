import { Schema } from 'mongoose';

export const applySchemaTransform = (schema: Schema) => {
  const transform = (_doc: unknown, ret: Record<string, unknown>) => {
    if (ret._id) {
      ret.id = String(ret._id);
      delete ret._id;
    }
    return ret;
  };

  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { virtuals: true, versionKey: false, transform });
};
