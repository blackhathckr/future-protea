import morgan from 'morgan';
import { Request } from 'express';
import logger from '../utils/logger';

morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const body = { ...req.body } as Record<string, unknown>;
    if (body.password) body.password = '***';
    return JSON.stringify(body).substring(0, 200);
  }
  return '';
});

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const skip = (): boolean => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};

const detailedFormat = ':method :url :status :response-time ms - :res[content-length] bytes';

const morganMiddleware = morgan(detailedFormat, { stream, skip });

export default morganMiddleware;
