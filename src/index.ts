import express, { Request, Response } from 'express';
import path from 'path';
import * as dotenv from 'dotenv';
import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import passportConfig from './config/passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';

// Messaging
import { createServer } from 'http';
import { Server as MessagingServer } from 'socket.io';
import { messagingSocket } from './controllers/messaging';

// Routes
import userRoutes from './routes/user';
import uploadRoutes from './routes/upload';
import workspaceRoutes from './routes/workspace';
import jobRoutes from './routes/jobs';
import profileRoutes from './routes/profile';
import socialRoutes from './routes/social';
import messagingRoutes from './routes/messaging';
import chapaRoutes from './routes/chapa';
import projectRoutes from './routes/project';

import morgan from 'morgan';
import { mongoUrl, nodeEnv } from './config';
import passport from 'passport';
dotenv.config();

const PORT = process.env.PORT || 5000;

// Passport config
passportConfig(passport);

const app = express();
const httpServer = createServer(app);
const chatIo = new MessagingServer(httpServer, {
  cors: {
    origin: '*',
  },
});

// Middleware to accept JSON in body
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl,
    }),
  }),
);

// Morgan logging
app.use(morgan('dev'));

connectDB();

chatIo.on('connection', messagingSocket);

app.get('/', (_req: Request, res: Response) => {
  res.send('API IS RUNNING...');
});

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/messaging', messagingRoutes);
app.use('/api/v1/chapa', chapaRoutes);
app.use('/api/v1/projects', projectRoutes);

// Make uploads folder static
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// Use Middleware
app.use(notFound);
app.use(errorHandler);

if (httpServer.listening) {
  // if the server is listening, close it
  console.log('Server is listening');
  httpServer.close();
}

httpServer.listen(PORT, () => {
  console.log(`Server running in ${nodeEnv} mode on port ${PORT}`);
});

export default httpServer;

export { chatIo };
