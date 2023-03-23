import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import passportConfig from './config/passport';
import session from 'express-session';

// Routes
import userRoutes from './routes/user';
import uploadRoutes from './routes/upload';
import workspaceRoutes from './routes/workspace';
import morgan from 'morgan';
import { nodeEnv } from './config';
import passport from 'passport';

const PORT = process.env.PORT || 5000;

// Passport config
passportConfig(passport);

const app = express();

// Middleware to accept JSON in body
app.use(express.json());
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  }),
);

// Morgan logging
app.use(morgan('dev'));

dotenv.config();

connectDB();

app.use('/api/v1/users/', userRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/workspaces/', workspaceRoutes);

// Make uploads folder static
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// Use Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${nodeEnv} mode on port ${PORT}`);
});

app.get('/', (_req: Request, res: Response) => {
  res.send('API IS RUNNING...');
});

// TODO: Setup route for jobs
// TODO: Validate user and employer for legitimacy
// TODO: Setup route for profiles
// TODO: Get social media content from database
// TODO: Create a communication channel between users for messaging including text, image, GIF
// TODO: Create a progress system for skill use and upgrading upon task/job completion
// TODO: Implement badges and skill listings
// TODO: Get SVT Quizzes per skill

// NOTE: What does a job contain?
// NOTE: What are the components that are inside the workspace page (eg. list of projects)
