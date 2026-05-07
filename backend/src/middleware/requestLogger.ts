import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.method !== 'GET') {
    const body = { ...req.body } as Record<string, unknown>;
    if (body.password) body.password = '***';
    if (body.token) body.token = '***';

    logger.info(`${req.method} ${req.url}`);
    if (Object.keys(body).length > 0) {
      logger.debug(`   Body: ${JSON.stringify(body).substring(0, 200)}`);
    }
  }
  next();
};

export default requestLogger;
