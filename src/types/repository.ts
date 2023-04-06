import { Model, Document } from 'mongoose';

/**
 * Represents a repository
 */
export interface IRepository {
  name: string;
  files: object[];
  owner: string;
}

export interface ICleanRepository extends IRepository {
  id: string;
}

export interface IRepositoryDocument extends IRepository, Document {
  cleanRepository: () => Promise<ICleanRepository>;
}

export interface IRepositoryModel extends Model<IRepositoryDocument> {}
