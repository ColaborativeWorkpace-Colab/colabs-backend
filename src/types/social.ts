import { Model, Document, Types } from 'mongoose';

/**
 * Represents a Post
 */

export interface IComment {
  userId: Types.ObjectId;
  comment: string;
}

export interface IPost {
  textContent: string;
  imageContent: string;
  likes: Types.ObjectId[];
  tags: string[];
  comments: IComment[];
  donatable: boolean;
  userId: Types.ObjectId;
}

export interface ICleanPost extends IPost {
  id: string;
}

export interface IPostDocument extends IPost, Document {}

export interface IPostModel extends Model<IPostDocument> {}
