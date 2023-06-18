import {
  IJobDocument,
  IJobModel,
  IJobApplicationDocument,
  IJobApplicationModel,
  JobApplicationStatus,
  JobStatus,
} from '../../../types';
import mongoose, { Schema, SchemaTypes } from 'mongoose';

const JobSchema: Schema<IJobDocument, IJobModel> = new mongoose.Schema(
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
    pendingworkers: {
      type: [String],
    },
    requirements: {
      type: [String],
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.Pending,
    },
    owner: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentVerified: {
      type: Boolean,
      default: false,
    },
    filesReady: {
      type: [String],
    },
  },
  {
    timestamps: true, // Automatically create createdAt timestamp
  },
);

const JobApplicationSchema: Schema<IJobApplicationDocument, IJobApplicationModel> = new mongoose.Schema(
  {
    workerId: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: 'User',
    },
    jobId: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: 'Job',
    },
    coverLetter: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(JobApplicationStatus),
      default: JobApplicationStatus.Pending,
    },
  },
  {
    timestamps: true, // Automatically create createdAt timestamp
  },
);

export { JobSchema, JobApplicationSchema };
