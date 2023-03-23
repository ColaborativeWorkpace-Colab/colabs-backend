import mongoose, { Schema } from 'mongoose';
import { IRepositoryDocument, IRepositoryModel } from 'src/types';
import { modelMethods, staticMethods } from './methods';

const repositorySchema: Schema<IRepositoryDocument, IRepositoryModel> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    // TODO: Check if github gives url to repository created through their API
  },
  {
    timestamps: true, // Automatically create createdAt timestamp
  },
);

repositorySchema.method(modelMethods);
repositorySchema.static(staticMethods);

export default mongoose.model<IRepositoryDocument, IRepositoryModel>('Repository', repositorySchema);
