import { Pool } from 'pg';
import logger from '../utils/logger';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'cricket_match_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
});

pool.on('connect', () => {
  logger.info('PostgreSQL connected successfully (using pg Pool)');
});

pool.on('error', (err: Error) => {
  logger.error('PostgreSQL connection error: ' + err.message);
});

export default pool;
