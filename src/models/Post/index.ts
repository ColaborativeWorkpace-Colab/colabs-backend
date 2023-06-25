import mongoose, { Schema, SchemaTypes } from 'mongoose';
import { IPostDocument, IPostModel } from 'src/types';
import { modelMethods, staticMethods } from './methods';

const CommentSchema: Schema = new mongoose.Schema(
  {
    comment: {
      type: String,
    },
    userId: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

const postSchema: Schema<IPostDocument, IPostModel> = new mongoose.Schema(
  {
    textContent: {
      type: String,
    },
    imageContent: {
      type: String,
    },
    likes: [
      {
        type: SchemaTypes.ObjectId,
        ref: 'User',
      },
    ],
    tags: {
      type: [String],
    },
    comments: [CommentSchema],
    donatable: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true, // Automatically create createdAt timestamp
  },
);

postSchema.method(modelMethods);
postSchema.static(staticMethods);

export default mongoose.model<IPostDocument, IPostModel>('Post', postSchema);
