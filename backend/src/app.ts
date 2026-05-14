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

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(routes);

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
});

export default app;
