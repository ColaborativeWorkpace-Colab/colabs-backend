import { Document, Model, Types } from 'mongoose';

export enum ProjectStatus {
  ONGOING = 'ONGOING',
  CLOSED = 'CLOSED', // update me
  COMPLETED = 'COMPLETED',
}

export interface IWorkerInfo {
  workerId: Types.ObjectId;
  earnings: number;
  paymentRequested: boolean;
  isPaid: boolean;
}

export interface Project {
  title: string;
  members: IWorkerInfo[];
  repositoryId: Types.ObjectId;
  status: ProjectStatus;
  owner: Types.ObjectId;
}

export interface ProjectDocument extends Project, Document {}
export interface ProjectModel extends Model<ProjectDocument> {}
