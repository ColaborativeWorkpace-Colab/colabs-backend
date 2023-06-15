import { Document, Model, Types } from 'mongoose';
import { LegalInfo } from './user';

export enum RequestType {
  VERIFICATION = 'VERIFICATION',
  COMPLAIN = 'COMPLAIN',
}

export enum RequestStatus {
  INREVIEW = 'INREVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface RequestDocs {
  name: string;
  img: string;
}

export interface Request {
  user: Types.ObjectId;
  type: RequestType;
  status: string;
  legalInfo: LegalInfo; // todo update me to handle all types of requests
}

export interface RequestDocument extends Request, Document {}
export interface RequestModel extends Model<RequestDocument> {}
