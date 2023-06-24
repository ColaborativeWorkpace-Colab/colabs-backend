import { Model, Document, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

// Payment
export interface Payment {
  freelancerId: Types.ObjectId;
  employerId: Types.ObjectId;
  amount: number;
  status: PaymentStatus;
  txRef: string;
  currency: string;
  projectId: Types.ObjectId;
}

// Documents
export interface PaymentDocument extends Payment, Document {}

// Models
export interface PaymentModel extends Model<PaymentDocument> {}
