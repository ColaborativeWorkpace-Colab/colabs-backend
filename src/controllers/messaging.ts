import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Socket } from 'socket.io';
import { Chat } from '../models';
import { ChatType } from '../types';

const connectedUsers: { [userId: string]: string } = {};

/**
 * Messaging Socket
 * @access Private
 */
const messagingSocket = (socket: Socket<any>) => {
  socket.on('connect-user', async (userId: string) => {
    if (!connectedUsers[userId]) connectedUsers[userId] = socket.id;

    // console.log(`${userId} connected`);
    // console.log(connectedUsers);
  });

  socket.on('disconnect-user', (disconnectingUserId: string) => {
    delete connectedUsers[disconnectingUserId];

    // console.log(`${disconnectingUserId} disconnected`);
    // console.log(connectedUsers);
  });

  socket.on(
    'private-message',
    async (data: { senderId: string; receiverId: string; message: string; chatId?: string }) => {
      if (connectedUsers[data.receiverId])
        socket.to(connectedUsers[data.receiverId]).emit('incoming_private_message', data.message);

      if (data.chatId) {
        const chat = await Chat.findById(data.chatId);

        if (chat) {
          await chat.updateOne({
            totalMessages: [
              ...chat.totalMessages,
              { sender: data.senderId, message: data.message, timestamp: Date.now() },
            ],
            inbox: [...chat.inbox, { sender: data.senderId, message: data.message, timestamp: Date.now() }],
          });

          // if (!messageStored) console.error('Failed to store message');
          // TODO: Handle errors
        }
      } else {
        await Chat.create({
          type: ChatType.Private,
          members: [data.senderId, data.receiverId],
          totalMessages: [{ sender: data.senderId, message: data.message, timestamp: Date.now() }],
          inbox: [{ sender: data.senderId, message: data.message, timestamp: Date.now() }],
        });

        // if (!chat) console.error('Failed to create chat');
        // else console.info('Chat stored');
        // TODO: Handle errors
      }
    },
  );

  socket.on(
    'group-message',
    async (data: { senderId: string; groupChatId?: string; members?: string; message: string }) => {
      if (data.groupChatId) socket.to(data.groupChatId).emit('incoming_group_message', data.message);

      if (data.groupChatId) {
        const chat = await Chat.findById(data.groupChatId);

        if (chat) {
          await chat.updateOne({
            totalMessages: [
              ...chat.totalMessages,
              { sender: data.senderId, message: data.message, timestamp: Date.now() },
            ],
            inbox: [...chat.inbox, { sender: data.senderId, message: data.message, timestamp: Date.now() }],
          });

          // if (!messageStored) console.error('Failed to store message');
          // TODO: Handle errors
        }
      } else {
        await Chat.create({
          type: ChatType.Group,
          members: data.members?.split(','),
          totalMessages: [{ sender: data.senderId, message: data.message, timestamp: Date.now() }],
          inbox: [{ sender: data.senderId, message: data.message, timestamp: Date.now() }],
        });

        // if (!chat) console.error('Failed to create group chat');
        // else console.info('Chat stored');
        // TODO: Handle errors
      }
    },
  );
};

/**
 * Get Messages
 * @route GET /api/v1/messaging/:userId
 * @access Private
 */
const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
  const messages = await Chat.find({ members: { $in: [userId] } });

  if (messages) {
    res.json({
      messages,
      connectedUsers,
    });
  } else {
    res.status(404);
    throw new Error('Messages not found');
  }
});

export { messagingSocket, getMessages };
