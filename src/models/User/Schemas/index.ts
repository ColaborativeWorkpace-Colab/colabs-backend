import { Schema } from 'mongoose';
import { IUserDocument, IUserModel, LegalInfo } from 'src/types';

export const LegalInfoSchema: Schema<LegalInfo> = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const UserSchema: Schema<IUserDocument, IUserModel> = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    skills: {
      type: [String],
    },
    googleId: String,
    emailVerified: Boolean,
  },
  { timestamps: true },
);

const FreelancerSchema: Schema<IUserDocument, IUserModel> = new Schema(
  {
    isVerified: {
      type: Boolean,
      default: false,
    },
    jobs: {
      type: [String],
    },
    reviews: {
      type: [String],
    },
    hourlyRate: {
      type: Number,
      defualt: 10,
    },
  },
  { timestamps: true, discriminatorKey: 'role' },
);

const EmployerSchema: Schema<IUserDocument, IUserModel> = new Schema(
  {
    legalInfo: {
      type: [LegalInfoSchema],
    },
    companyName: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
    },
    jobs: {
      type: [String],
    },
    reviews: {
      type: [String],
    },
  },
  { timestamps: true, discriminatorKey: 'role' },
);

export { FreelancerSchema, EmployerSchema, UserSchema };
