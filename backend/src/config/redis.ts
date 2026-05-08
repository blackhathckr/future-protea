import Redis from 'ioredis';
import logger from '../utils/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Main Redis client for general operations
export const redisClient = new Redis(redisConfig);

// Publisher client for pub/sub
export const redisPublisher = new Redis(redisConfig);

// Subscriber client for pub/sub
export const redisSubscriber = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisPublisher.on('connect', () => {
  logger.info('Redis publisher connected');
});

redisSubscriber.on('connect', () => {
  logger.info('Redis subscriber connected');
});

export default redisClient;
