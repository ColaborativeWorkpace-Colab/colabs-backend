import { Schema, model } from 'mongoose';
import { PaymentDocument, PaymentModel, PaymentStatus } from '../../types';
import { modelMethods, staticMethods } from './methods';

const PaymentSchema: Schema<PaymentDocument, PaymentModel> = new Schema(
  {
    freelancerId: {
      type: String,
      required: true,
    },
    employerId: {
      type: String,
      required: true,
    },
    jobId: {
      type: String,
      required: true,
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
  },
  { timestamps: true },
);

PaymentSchema.method(modelMethods);
PaymentSchema.static(staticMethods);

export default model<PaymentDocument, PaymentModel>('Payment', PaymentSchema);
