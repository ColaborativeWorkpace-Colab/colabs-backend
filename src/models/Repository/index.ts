import mongoose, { Schema } from 'mongoose';
import { IRepositoryDocument, IRepositoryModel } from 'src/types';
import { modelMethods, staticMethods } from './methods';

const repositorySchema: Schema<IRepositoryDocument, IRepositoryModel> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    files: {
      type: [Object],
      default: [],
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
