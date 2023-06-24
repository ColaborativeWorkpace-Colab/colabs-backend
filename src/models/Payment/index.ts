import { Schema, SchemaTypes, model } from 'mongoose';
import { PaymentDocument, PaymentModel, PaymentStatus } from '../../types';
import { modelMethods, staticMethods } from './methods';

const PaymentSchema: Schema<PaymentDocument, PaymentModel> = new Schema(
  {
    freelancerId: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
    },
    employerId: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,

      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    txRef: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  { timestamps: true },
);

PaymentSchema.method(modelMethods);
PaymentSchema.static(staticMethods);

export default model<PaymentDocument, PaymentModel>('Payment', PaymentSchema);
