import { Model, Document } from 'mongoose';
import { Profile } from 'passport-google-oauth20';

/**
 * Represents a user
 */
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
  isWorkVerified: boolean;
  isRecruiterVerified: boolean;
  skills: String[];
  googleId: String;
  emailVerified: Boolean;
}

export interface IFreelance extends IUser {
  isVerified: boolean;
  jobs: string[];
  reviews: string[];
  hourlyRate: Number;
}

export interface IEmployer extends IUser {
  isVerified: boolean;
  jobs: string[];
  reviews: string[];
  companyName: string;
  legalInfo: LegalInfo[];
}

export type LegalInfo = {
  name: string;
  image: string;
};
export interface ICleanUser extends IUser {
  id: string;
}

// Documents
export interface IUserDocument extends IUser, IFreelance, IEmployer, Document {
  matchPassword: (password: string) => Promise<Boolean>;
  cleanUser: () => Promise<ICleanUser>;
}

export interface IUserModel extends Model<IUserDocument> {
  authUser: (password: string, email: string) => Promise<IUserDocument>;
  createWithGoogle: (profile: Profile) => Promise<IUserDocument>;
}
