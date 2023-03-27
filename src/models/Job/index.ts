import mongoose, { Schema } from 'mongoose';
import { IJobDocument, IJobModel } from 'src/types';
import { modelMethods, staticMethods } from './methods';

const jobSchema: Schema<IJobDocument, IJobModel> = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    earnings: {
      type: Number,
      required: true,
    },
    workers: {
      type: [String],
    },
    requirements: {
      type: [String],
    },
    status: {
      type: String,
      default: 'Available',
    },
    owner: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically create createdAt timestamp
  },
);

jobSchema.method(modelMethods);
jobSchema.static(staticMethods);

export default mongoose.model<IJobDocument, IJobModel>('Job', jobSchema);