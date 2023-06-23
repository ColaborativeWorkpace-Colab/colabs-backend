import { Model, Document, Types } from 'mongoose';

/**
 * Represents a Post
 */
export interface IPost {
  textContent: string;
  imageContent: string;
  likes: string[];
  tags: string[];
  comments: [{ userId: string; comment: string }];
  donatable: boolean;
  userId: Types.ObjectId;
}

export interface ICleanPost extends IPost {
  id: string;
}

export interface IPostDocument extends IPost, Document {}

export interface IPostModel extends Model<IPostDocument> {}
