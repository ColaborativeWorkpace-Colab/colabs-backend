import { Model, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

// Payment
export interface Payment {
  freelancerId: string;
  employerId: string;
  jobId: string;
  amount: number;
  status: PaymentStatus;
  txRef: string;
  currency: string;
}

// Documents
export interface PaymentDocument extends Payment, Document {}

// Models
export interface PaymentModel extends Model<PaymentDocument> {}
