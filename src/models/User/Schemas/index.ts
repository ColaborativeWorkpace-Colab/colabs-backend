import { Schema } from 'mongoose';
import { IUserDocument, IUserModel, LegalInfo } from '../../../types';

export const LegalInfoSchema: Schema<LegalInfo> = new Schema({
  bank: {
    accountNumber: String,
    bankCode: String,
    accountName: String,
    businessName: String,
  },
  legalDoc: String,
  tradeLicense: String,
});

const UserSchema: Schema<IUserDocument, IUserModel> = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    bio: {
      type: String,
    },
    occupation: {
      type: String,
    },
    location: {
      type: String,
    },
    tags: {
      type: [Object],
    },
    isRegulator: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    connections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },
    legalInfo: {
      type: LegalInfoSchema,
    },
    imageUrl: String,
    googleId: String,
    emailVerified: Boolean,
  },
  { timestamps: true, discriminatorKey: 'type' },
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
    skills: {
      type: [String],
    },
    hourlyRate: {
      type: Number,
      defualt: 10,
    },
    permissions: {
      type: Object,
      default: {
        adminAccess: {
          projects: [],
        },
        uploadFiles: {
          projects: [],
        },
        deleteFiles: {
          projects: [],
        },
        deleteProject: {
          projects: [],
        },
      },
    },

    subAccountId: {
      type: String,
    },
    earnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const EmployerSchema: Schema<IUserDocument, IUserModel> = new Schema(
  {
    companyName: {
      type: String,
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
  { timestamps: true },
);

export { FreelancerSchema, EmployerSchema, UserSchema };
