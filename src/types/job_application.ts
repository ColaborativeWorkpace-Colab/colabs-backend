import { Model, Document, Types } from 'mongoose';

/**
 * Represents a Job Application
 */
export interface IJobApplication {
  workerId: Types.ObjectId;
  jobId: Types.ObjectId;
  coverLetter: string;
  estimatedDeadline: string;
  status: JobApplicationStatus;
}

export interface ICleanJobApplication extends IJobApplication {
  id: string;
}

export interface IJobApplicationDocument extends IJobApplication, Document {}

export interface IJobApplicationModel extends Model<IJobApplicationDocument> {}

export enum JobApplicationStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}
