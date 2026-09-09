import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(
    cors({
      origin: (origin, callback) => callback(null, true),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/', (_req, res) => {
    res.json({
      message: 'Backend API is running',
      environment: env.nodeEnv,
    });
  });

  app.use('/api', apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}