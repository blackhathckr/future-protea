import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import requestLogger from './middleware/requestLogger';
import logger from './utils/logger';
import { initSocketIO } from './services/socketService';
import { seedAdminDefaults } from './utils/seedAdmin';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://10.66.199.18:5173',
      'http://10.66.199.18:5174',
      'http://10.66.199.18:3000',
      'http://10.66.199.18:5000',
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (origin && origin.includes('ngrok')) {
      // Allow ngrok URLs
      callback(null, true);
    } else {
      // For other origins in development, allow them
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));
app.use(express.json());
app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);

app.get('/health', (_req: Request, res: Response) => {
  logger.info('Health check requested');
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`ERROR: ${err.message}`);
  logger.error(`   Route: ${req.method} ${req.url}`);
  logger.error(`   Stack: ${err.stack}`);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

initSocketIO(httpServer);

httpServer.listen(PORT as number, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  logger.info('Cricket Match Management API Server Started');
  console.log('='.repeat(60));
  logger.info(`Port: ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
  logger.info(`Health Check: http://localhost:${PORT}/health`);
  logger.info(`Socket.IO: ws://localhost:${PORT}`);
  logger.info(`Logs Directory: ./logs/`);
  console.log('='.repeat(60) + '\n');
  logger.info('Server ready to accept requests...\n');

  // Seed default permissions + system roles. Safe to run on every boot —
  // upserts only, won't duplicate.
  seedAdminDefaults().catch((e) => logger.error('Admin seed failed', e));
});

export default app;
