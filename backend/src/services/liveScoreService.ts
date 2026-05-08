import { redisPublisher, redisClient } from '../config/redis';
import logger from '../utils/logger';

export interface LiveScoreUpdate {
  matchId: number;
  innings: number;
  over: number;
  ball: number;
  runs: number;
  totalRuns: number;
  wickets: number;
  batsmanName: string;
  bowlerName: string;
  commentary: string;
  timestamp: string;
}

export class LiveScoreService {
  private static CHANNEL_PREFIX = 'match:';
  private static CACHE_TTL = 3600; // 1 hour

  /**
   * Publish live score update to Redis channel
   */
  static async publishScoreUpdate(matchId: number, update: LiveScoreUpdate): Promise<void> {
    try {
      const channel = `${this.CHANNEL_PREFIX}${matchId}`;
      const message = JSON.stringify(update);
      
      await redisPublisher.publish(channel, message);
      
      // Also cache the latest update
      await this.cacheLatestScore(matchId, update);
      
      logger.info(`Published score update for match ${matchId}`);
    } catch (error) {
      logger.error('Error publishing score update:', error);
      throw error;
    }
  }

  /**
   * Cache the latest score for quick retrieval
   */
  static async cacheLatestScore(matchId: number, update: LiveScoreUpdate): Promise<void> {
    try {
      const key = `match:${matchId}:latest`;
      await redisClient.setex(key, this.CACHE_TTL, JSON.stringify(update));
    } catch (error) {
      logger.error('Error caching latest score:', error);
    }
  }

  /**
   * Get latest cached score
   */
  static async getLatestScore(matchId: number): Promise<LiveScoreUpdate | null> {
    try {
      const key = `match:${matchId}:latest`;
      const data = await redisClient.get(key);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting latest score:', error);
      return null;
    }
  }

  /**
   * Cache match scorecard
   */
  static async cacheScorecard(matchId: number, scorecard: any): Promise<void> {
    try {
      const key = `match:${matchId}:scorecard`;
      await redisClient.setex(key, this.CACHE_TTL, JSON.stringify(scorecard));
      logger.info(`Cached scorecard for match ${matchId}`);
    } catch (error) {
      logger.error('Error caching scorecard:', error);
    }
  }

  /**
   * Get cached scorecard
   */
  static async getCachedScorecard(matchId: number): Promise<any | null> {
    try {
      const key = `match:${matchId}:scorecard`;
      const data = await redisClient.get(key);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting cached scorecard:', error);
      return null;
    }
  }

  /**
   * Invalidate match cache when match is updated
   */
  static async invalidateMatchCache(matchId: number): Promise<void> {
    try {
      const keys = [
        `match:${matchId}:latest`,
        `match:${matchId}:scorecard`,
      ];
      
      await redisClient.del(...keys);
      logger.info(`Invalidated cache for match ${matchId}`);
    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  /**
   * Get channel name for a match
   */
  static getChannelName(matchId: number): string {
    return `${this.CHANNEL_PREFIX}${matchId}`;
  }
}

export default LiveScoreService;
