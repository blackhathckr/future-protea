import { Router, Request, Response } from 'express';
import { redisSubscriber } from '../config/redis';
import LiveScoreService from '../services/liveScoreService';
import logger from '../utils/logger';

const router = Router();

/**
 * SSE endpoint for live score updates
 * GET /api/live/match/:id/stream
 */
router.get('/match/:id/stream', async (req: Request, res: Response) => {
  const matchId = parseInt(req.params.id as string);

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', matchId })}\n\n`);

  // Send latest cached score immediately
  const latestScore = await LiveScoreService.getLatestScore(matchId);
  if (latestScore) {
    res.write(`data: ${JSON.stringify({ type: 'update', data: latestScore })}\n\n`);
  }

  const channel = LiveScoreService.getChannelName(matchId);

  // Subscribe to Redis channel
  const messageHandler = (receivedChannel: string, message: string) => {
    if (receivedChannel === channel) {
      try {
        const update = JSON.parse(message);
        res.write(`data: ${JSON.stringify({ type: 'update', data: update })}\n\n`);
      } catch (error) {
        logger.error('Error parsing Redis message:', error);
      }
    }
  };

  redisSubscriber.subscribe(channel, (err) => {
    if (err) {
      logger.error(`Failed to subscribe to ${channel}:`, err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Subscription failed' })}\n\n`);
      res.end();
      return;
    }
    logger.info(`Client subscribed to ${channel}`);
  });

  redisSubscriber.on('message', messageHandler);

  // Handle client disconnect
  req.on('close', () => {
    redisSubscriber.unsubscribe(channel);
    redisSubscriber.off('message', messageHandler);
    logger.info(`Client disconnected from ${channel}`);
    res.end();
  });
});

/**
 * Get latest score for a match
 * GET /api/live/match/:id/latest
 */
router.get('/match/:id/latest', async (req: Request, res: Response) => {
  try {
    const matchId = parseInt(req.params.id as string);
    const latestScore = await LiveScoreService.getLatestScore(matchId);

    if (!latestScore) {
      return res.status(404).json({ error: 'No live score data available' });
    }

    res.json(latestScore);
  } catch (error) {
    logger.error('Error fetching latest score:', error);
    res.status(500).json({ error: 'Failed to fetch latest score' });
  }
});

/**
 * Get cached scorecard
 * GET /api/live/match/:id/scorecard
 */
router.get('/match/:id/scorecard', async (req: Request, res: Response) => {
  try {
    const matchId = parseInt(req.params.id as string);
    const scorecard = await LiveScoreService.getCachedScorecard(matchId);

    if (!scorecard) {
      return res.status(404).json({ error: 'No cached scorecard available' });
    }

    res.json(scorecard);
  } catch (error) {
    logger.error('Error fetching cached scorecard:', error);
    res.status(500).json({ error: 'Failed to fetch scorecard' });
  }
});

export default router;
