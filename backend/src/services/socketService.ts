import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisSubscriber } from '../config/redis';
import LiveScoreService, { LiveScoreUpdate } from './liveScoreService';
import logger from '../utils/logger';

let io: SocketIOServer | null = null;

/**
 * Initialise Socket.IO, attach it to the HTTP server, and bridge
 * every Redis match channel to the corresponding Socket.IO room.
 */
export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',           // Flutter mobile + any web client
      methods: ['GET', 'POST'],
      credentials: false,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    const clientIp = socket.handshake.address;
    logger.info(`[Socket.IO] Client connected: ${socket.id} from ${clientIp}`);

    // ── join_match ──────────────────────────────────────────────────────────
    // Client sends: { matchId: string }
    // Server joins the socket to room `match:<matchId>` and sends back the
    // latest cached score so the client has an immediate snapshot.
    socket.on('join_match', async (payload: { matchId: string }) => {
      const matchId = payload?.matchId;
      if (!matchId || typeof matchId !== 'string') {
        socket.emit('error', { message: 'join_match requires a matchId' });
        return;
      }

      const room = `match:${matchId}`;
      socket.join(room);
      logger.info(`[Socket.IO] ${socket.id} joined room ${room}`);

      // Immediately subscribe the global Redis listener for this channel
      // (idempotent — ioredis ignores duplicate channel subs)
      const channel = LiveScoreService.getChannelName(matchId);
      redisSubscriber.subscribe(channel, (err) => {
        if (err) logger.error(`[Socket.IO] Redis subscribe error for ${channel}:`, err);
      });

      // Send snapshot of latest cached score to this client only
      try {
        const latest = await LiveScoreService.getLatestScore(matchId);
        if (latest) {
          socket.emit('ball_event', { type: 'snapshot', data: latest });
        } else {
          socket.emit('ball_event', { type: 'connected', matchId });
        }
      } catch (err) {
        logger.error('[Socket.IO] Error fetching snapshot:', err);
        socket.emit('ball_event', { type: 'connected', matchId });
      }
    });

    // ── leave_match ─────────────────────────────────────────────────────────
    socket.on('leave_match', (payload: { matchId: string }) => {
      const matchId = payload?.matchId;
      if (matchId) {
        socket.leave(`match:${matchId}`);
        logger.info(`[Socket.IO] ${socket.id} left room match:${matchId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id} reason=${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`[Socket.IO] Socket error for ${socket.id}:`, err);
    });
  });

  // ── Redis → Socket.IO bridge ─────────────────────────────────────────────
  // All Redis match:* messages are forwarded to the corresponding Socket.IO room.
  redisSubscriber.on('message', (channel: string, message: string) => {
    // channel format: "match:<matchId>"
    if (!channel.startsWith('match:')) return;
    try {
      const update: LiveScoreUpdate = JSON.parse(message);
      const room = channel; // room name == channel name
      if (io) {
        io.to(room).emit('ball_event', { type: 'update', data: update });
        logger.info(`[Socket.IO] Emitted ball_event to room ${room}`);
      }
    } catch (err) {
      logger.error('[Socket.IO] Error forwarding Redis message:', err);
    }
  });

  logger.info('[Socket.IO] Server initialised and attached to HTTP server');
  return io;
}

/**
 * Emit a ball_event directly to a match room without going through Redis.
 * Used by the scoring controller for low-latency delivery.
 */
export function emitBallEvent(matchId: string, payload: LiveScoreUpdate): void {
  if (!io) return;
  const room = `match:${matchId}`;
  io.to(room).emit('ball_event', { type: 'update', data: payload });
}

/**
 * Returns the shared Socket.IO server instance (may be null before init).
 */
export function getIO(): SocketIOServer | null {
  return io;
}
