import { Model, Document } from 'mongoose';
import { Profile } from 'passport-google-oauth20';
import { Profile as GithubProfile } from 'passport-github2';
import { Permission } from './permission';

export type Tag = {
  name: string;
  score: number;
};

export enum UserType {
  FREELANCER = 'freelancer',
  EMPLOYER = 'employer',
}

// Types
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  bio: string;
  occupation: string;
  location: string;
  tags: [Tag];
  isAdmin: boolean;
  isRegulator: boolean;
  googleId: string;
  emailVerified: boolean;
  imageUrl: string;
  connections: string[];
  lastSeen: Date;
  isOnline: boolean;
  legalInfo: LegalInfo;
}

export interface BankAccountInfo {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  businessName: string;
}
export interface IFreelance extends IUser {
  isVerified: boolean;
  jobs: string[];
  reviews: string[];
  skills: string[];
  hourlyRate: number;
  permissions: Permission;
  subAccountId?: string;
  earnings: number;
}

export interface IEmployer extends IUser {
  isVerified: boolean;
  jobs: string[];
  reviews: string[];
  companyName?: string;
}

export type LegalInfo = {
  bank: BankAccountInfo;
  legalDoc: string;
  tradeLicense: string;
};
export interface ICleanUser extends IUser {
  id: string;
}

// Documents
export interface IUserDocument extends IUser, IFreelance, IEmployer, Document {
  matchPassword: (password: string) => Promise<Boolean>;
  cleanUser: () => Promise<ICleanUser>;
}

// Models
export interface IUserModel extends Model<IUserDocument> {
  authUser: (password: string, email: string) => Promise<IUserDocument>;
  createWithGoogle: (profile: Profile) => Promise<IUserDocument>;
  createWithGithub: (profile: GithubProfile) => Promise<IUserDocument>;
}
