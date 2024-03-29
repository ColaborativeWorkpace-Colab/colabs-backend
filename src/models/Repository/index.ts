import mongoose, { Schema, SchemaTypes } from 'mongoose';
import { IRepositoryDocument, IRepositoryModel } from 'src/types';
import { modelMethods, staticMethods } from './methods';

const repositorySchema: Schema<IRepositoryDocument, IRepositoryModel> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tasks: {
      type: [Object],
    },
    files: {
      type: [Object],
    },
    members: {
      type: [SchemaTypes.ObjectId],
      ref: 'User',
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

repositorySchema.method(modelMethods);
repositorySchema.static(staticMethods);

export default mongoose.model<IRepositoryDocument, IRepositoryModel>('Repository', repositorySchema);
