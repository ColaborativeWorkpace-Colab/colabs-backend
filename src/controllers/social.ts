import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { User, Post } from '../models';
import { Types } from 'mongoose';
import { NOT_FOUND, INTERNAL_SERVER_ERROR, NO_CONTENT } from 'http-status';

/**
 * Get Posts
 * @route GET /api/v1/social
 * @access Public
 */
const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const searchQuery = req.query as unknown as {
    start: number;
    limit: number;
    order: 'asc' | 'desc';
  };

  const data = await Post.aggregate([
    {
      $facet: {
        posts: [
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'likes',
              foreignField: '_id',
              as: 'likes',
            },
          },
          {
            $project: {
              _id: 1,
              textContent: 1,
              imageContent: 1,
              likes: 1,
              tags: 1,
              comments: 1,
              donatable: 1,
              createdAt: 1,
              updatedAt: 1,
              user: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                imageUrl: 1,
              },
            },
          },

          {
            $sort: {
              createdAt: searchQuery.order === 'asc' ? 1 : -1,
            },
          },
          {
            $skip: Number(searchQuery.start * searchQuery.limit) || 0,
          },
          {
            $limit: Number(searchQuery.limit) || 10,
          },
        ],

        total: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const total = data[0].total[0]?.count || 0;
  const hasNextPage = total > Number(searchQuery.start * searchQuery.limit) + Number(searchQuery.limit);

  res.json({
    data: data[0].posts,
    filters: {
      ...searchQuery,
    },
    hasNextPage,
    total,
  });
});

/**
 * Post Content
 * @route POST /api/v1/social
 * @access Public
 */
const postContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { textContent, imageContent, tags } = req.body as {
    textContent?: string;
    imageContent?: string;
    tags: string;
  };

  let errorMessage = 'User not found';
  let statusCode: number = NOT_FOUND;

  errorMessage = 'Failed posting content';
  statusCode = INTERNAL_SERVER_ERROR;

  const post = await Post.create({
    textContent,
    imageContent,
    tags: tags
      .trim()
      .split(',')
      .map((el) => el.trim()),
    userId,
  });

  if (post) {
    res.json({
      message: 'Content Posted',
      post,
    });

    return;
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Like Post
 * @route PUt /api/v1/social/like/:postId
 * @access Public
 */
const likePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id as unknown as Types.ObjectId;
  const { postId } = req.params as { postId: string };
  const post = await Post.findById(postId);

  let errorMessage = 'Post not found';
  let statusCode: number = NOT_FOUND;

  if (post) {
    errorMessage = 'Failed to like post';
    statusCode = INTERNAL_SERVER_ERROR;

    if (!post.likes.includes(userId)) {
      post.likes = [...post.likes, userId];
      await post.save();
    } else {
      res.json({ message: 'Post already liked' });
      return;
    }

    if (post.likes.includes(userId)) {
      res.json({ message: 'Post Liked' });
      return;
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Comment on Post
 * @route PUt /api/v1/social/:userId/:postId/comment
 * @access Public
 */
const commentPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { postId } = req.params as { postId: string };
  const { comment } = req.body as { comment: string };
  const post = await Post.findById(postId);

  let errorMessage = 'Post not found';
  let statusCode: number = NOT_FOUND;

  if (post) {
    errorMessage = 'Failed to comment on post';
    statusCode = INTERNAL_SERVER_ERROR;

    const commentPosted = await post.updateOne({ comments: [...post.comments, { userId, comment }] });

    if (commentPosted) {
      res.json({
        message: 'Commented on post',
      });

      return;
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Edit Post
 * @route PUt /api/v1/social/:userId/:postId/edit
 * @access Public
 */
const editPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params as { postId: string };
  const { textContent, imageContent, tags } = req.body as { textContent?: string; imageContent?: string; tags: string };
  const post = await Post.findById(postId);

  let errorMessage = 'Post not found';
  let statusCode: number = NOT_FOUND;

  if (post) {
    errorMessage = 'Failed to edit post';
    statusCode = INTERNAL_SERVER_ERROR;

    const postEdited = await post.updateOne({
      textContent,
      imageContent,
      tags: tags.split(','),
    });

    if (postEdited) {
      res.json({
        message: 'Post edited',
      });

      return;
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Get user's connections
 * @route GET /api/v1/social/connections/:userId
 * @access Private
 */
const getUserSocialConnections = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
  const user = await User.findById(userId);

  const errorMessage = 'User not found';
  const statusCode = NOT_FOUND;

  if (user) {
    res.json({
      connections: user.connections,
    });

    return;
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Add other user to the user's connections
 * @route PUT /api/v1/social/connections/:userId/addConnection
 * @access Private
 */
const addUserSocialConnections = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { otherUserId } = req.body as { otherUserId: string };
  const user = await User.findById(userId);
  const otherUser = await User.findById(otherUserId);

  let errorMessage = 'User not found';
  let statusCode: number = NOT_FOUND;

  if (user && otherUser) {
    errorMessage = "Failed to add connection to the user's database entry";
    statusCode = INTERNAL_SERVER_ERROR;
    if (user.connections.includes(otherUser._id)) {
      res.json({
        message: 'User already in your connections list',
      });
      return;
    }

    user.connections = [...user.connections, otherUser._id];
    await user.save();
    res.json({
      message: 'User added to your connections list',
      user,
    });
    return;
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Remove other user from the user's connections
 * @route PUT /api/v1/social/connections/:userId/removeConnection
 * @access Private
 */
const removeUserSocialConnections = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { otherUserId } = req.body as { otherUserId: string };
  const user = await User.findById(userId);
  const otherUser = await User.findById(otherUserId);

  let errorMessage = 'User not found';
  let statusCode: number = NOT_FOUND;

  if (user && otherUser) {
    errorMessage = "Failed to remove connection from the user's database entry";
    statusCode = INTERNAL_SERVER_ERROR;
    if (!user.connections.includes(otherUser._id)) {
      user.connections = user.connections.filter((connection) => connection !== otherUser._id);
      await user.save();
      res.json({
        message: 'User removed from your connections list',
      });

      return;
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Get post data of a certain topic and explore
 * @route PUT /api/v1/social/explore/:postTag
 * @access Private
 */
const getPostData = asyncHandler(async (req: Request, res: Response) => {
  const { postTag } = req.params as { postTag?: string };
  let posts;
  const statusCode: number = postTag !== null ? NOT_FOUND : NO_CONTENT;
  const errorMessage = postTag !== null ? 'Tag not found' : 'No Content Available';

  if (postTag !== null) {
    posts = await Post.find({ tags: { $in: [postTag] } })
      .sort({ createdAt: -1 })
      .limit(10);
  } else {
    posts = await Post.find({}).sort({ createdAt: -1 }).limit(10);
  }

  if (posts) {
    res.json({
      posts,
    });

    return;
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Get detail post
 * @route PUT /api/v1/social/explore/:postTag
 * @access Public
 */
const getDetail = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params as {
    postId: string;
  };
  const post = await Post.findById(postId).populate('userId').populate('likes').populate('comments.userId');
  if (!post) throw new Error('Post not found');

  res.send({
    message: 'Post detail',
    data: post,
  });
});

// TODO: donate to creator
export {
  getPosts,
  postContent,
  likePost,
  commentPost,
  editPost,
  getUserSocialConnections,
  addUserSocialConnections,
  removeUserSocialConnections,
  getPostData,
  getDetail,
};
