import { Model, Document, Types } from 'mongoose';

/**
 * Represents a Job
 */
export interface IJob {
  title: string;
  description: string;
  earnings: number;
  workers: string[];
  pendingworkers: string[];
  requirements: string[];
  status: JobStatus;
  owner: Types.ObjectId;
  paymentVerified: boolean;
  filesReady: string[];
}

export interface ICleanJob extends IJob {
  id: string;
}

export interface IJobDocument extends IJob, Document {}

export interface IJobModel extends Model<IJobDocument> {}

export enum JobStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Active = 'Active',
  Ready = 'Ready',
  Available = 'Available',
}
