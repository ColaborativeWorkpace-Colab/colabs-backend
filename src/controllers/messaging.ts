import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Socket } from 'socket.io';
import { Chat } from '../models';
import { ChatType } from '../types';
import { chatIo } from '../server';

const connectedUsers: { [userId: string]: string } = {};

/**
 * Messaging Socket
 * @access Private
 */
const messagingSocket = (socket: Socket<any>) => {
  socket.on('connect-user', async (userId: string) => {
    if (!connectedUsers[userId]) connectedUsers[userId] = socket.id;
  });

  socket.on('disconnect-user', (disconnectingUserId: string) => {
    delete connectedUsers[disconnectingUserId];
  });

  socket.on(
    'private-message',
    async (data: {
      senderId: string;
      receiverId: string;
      message: string;
      messageId: string;
      timeStamp: string;
      chatId?: string;
    }) => {
      if (connectedUsers[data.receiverId])
        chatIo.sockets.to(connectedUsers[data.receiverId]).emit('incoming_private_message', data.message);

      if (data.chatId) {
        const chat = await Chat.findById(data.chatId);

        if (chat) {
          const messageStored = await chat.updateOne({
            totalMessages: [
              ...chat.totalMessages,
              {
                messageId: data.messageId,
                sender: data.senderId,
                message: data.message,
                timestamp: Date.parse(data.timeStamp),
              },
            ],
            inbox: [...chat.inbox, data.messageId],
          });

          if (!messageStored)
            chatIo.sockets.to(connectedUsers[data.senderId]).emit('message_store_error', 'Failed to store message');
        }
      } else {
        const chatCreated = await Chat.create({
          type: ChatType.Private,
          members: [data.senderId, data.receiverId],
          totalMessages: [
            {
              messageId: data.messageId,
              sender: data.senderId,
              message: data.message,
              timestamp: Date.parse(data.timeStamp),
            },
          ],
          inbox: [data.messageId],
        });

        if (!chatCreated) chatIo.sockets.to(connectedUsers[data.senderId]).emit('chat_error', 'Failed to create chat');
        else
          chatIo.sockets
            .to(connectedUsers[data.senderId])
            .emit('receive_chat_id', { chatId: chatCreated.id, receiverId: data.receiverId });
      }
    },
  );

  socket.on(
    'group-message',
    async (data: {
      senderId: string;
      groupChatId?: string;
      members?: string;
      message: string;
      messageId: string;
      timeStamp: string;
    }) => {
      if (data.groupChatId)
        chatIo.sockets.to(connectedUsers[data.groupChatId]).emit('incoming_group_message', data.message);

      if (data.groupChatId) {
        const chat = await Chat.findById(data.groupChatId);

        if (chat) {
          const messageStored = await chat.updateOne({
            totalMessages: [
              ...chat.totalMessages,
              {
                messageId: data.messageId,
                sender: data.senderId,
                message: data.message,
                timestamp: Date.parse(data.timeStamp),
              },
            ],
            inbox: [...chat.inbox, data.messageId],
          });

          if (!messageStored)
            chatIo.sockets.to(connectedUsers[data.senderId]).emit('message_store_error', 'Failed to store message');
        }
      } else {
        const chatCreated = await Chat.create({
          type: ChatType.Group,
          members: data.members?.split(','),
          totalMessages: [
            {
              messageId: data.messageId,
              sender: data.senderId,
              message: data.message,
              timestamp: Date.parse(data.timeStamp),
            },
          ],
          inbox: [data.messageId],
        });

        if (!chatCreated)
          chatIo.sockets.to(connectedUsers[data.senderId]).emit('group_chat_error', 'Failed to create group chat');
        else
          chatIo.sockets
            .to(connectedUsers[data.senderId])
            .emit('receive_group_chat_id', { chatId: chatCreated.id, members: data.members });
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
