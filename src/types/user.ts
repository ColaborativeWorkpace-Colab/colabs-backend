import { Model, Document } from 'mongoose';

/**
 * Represents a user
 */
export interface IUser {
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}

export interface IUserDocument extends IUser, Document {
  matchPassword: (password: string) => Promise<Boolean>;
  cleanUser: () => Promise<IUser>;
}

export interface IUserModel extends Model<IUserDocument> {
  authUser: (password: string, email: string) => Promise<IUserDocument>;
}
