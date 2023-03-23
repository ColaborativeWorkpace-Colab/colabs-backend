import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';
import { IUserDocument, IUserModel, IRepository } from 'src/types';
import { modelMethods, staticMethods } from './methods';

const userSchema: Schema<IUserDocument, IUserModel> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    workspaces: {
      type: String,
      default: '',
      projects: {
        type: Array<IRepository>,
      },
    },
  },
  {
    timestamps: true, // Automatically create createdAt timestamp
  },
);

userSchema.method(modelMethods);
userSchema.static(staticMethods);

/**
 * Runs before the model saves and hecks to see if password has been
 * modified and hashes the password before saving to database
 */
userSchema.pre('save', async function (this: IUserDocument, next) {
  if (!this.isModified('password')) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model<IUserDocument, IUserModel>('User', userSchema);
