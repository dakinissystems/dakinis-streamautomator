/**
 * WebSocket Service (Socket.IO)
 * Real-time notifications for content publishing + roulette overlay
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 *
 * Note: Requires socket.io. Install: npm install socket.io
 */

import logger from '../utils/logger.js';
import { User } from '../modules/users/infrastructure/models.js';
import { getRedis } from '../utils/redisConnection.js';

let io = null;
let rouletteNs = null;
let pollNs = null;
let wsAvailable = false;
let wsPubSubEnabled = false;

async function configureRedisPubSubAdapter(socketServer) {
  if (process.env.WS_REDIS_ADAPTER === 'false') {
    return false;
  }
  try {
    const redisClient = await getRedis();
    if (!redisClient || typeof redisClient.duplicate !== 'function') {
      return false;
    }
    const [{ createAdapter }] = await Promise.all([
      import('@socket.io/redis-adapter'),
    ]);
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    socketServer.adapter(createAdapter(pubClient, subClient));
    wsPubSubEnabled = true;
    logger.info('WebSocket Redis pub/sub adapter enabled');
    return true;
  } catch (error) {
    logger.warn('WebSocket Redis pub/sub adapter unavailable, using in-process adapter', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Initialize WebSocket server (main app + roulette namespace for overlay).
 * Must await this before handling traffic: emits are no-ops until setup completes (was previously racy via .then()).
 */
export async function initWebSocket(server) {
  try {
    const { Server } = await import('socket.io');
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    });
    await configureRedisPubSubAdapter(io);

    io.on('connection', async (socket) => {
      const token = String(
        socket.handshake.auth?.token || socket.handshake.query?.token || ''
      ).trim();
      if (!token) {
        logger.debug('WebSocket connection rejected: missing token', { socketId: socket.id });
        socket.disconnect(true);
        return;
      }

      try {
        const { verifyStreamautomatorAccessToken } = await import('../utils/jwtAccess.js');
        const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';
        const payload = verifyStreamautomatorAccessToken(token, jwtSecret);
        const uidRaw = payload.id !== undefined ? payload.id : payload.sub;
        const userId = Number(uidRaw);
        if (!Number.isFinite(userId) || userId <= 0) {
          socket.disconnect(true);
          return;
        }
        const user = await User.findByPk(userId, { attributes: ['id', 'isDisabled'] });
        if (!user || user.isDisabled) {
          socket.disconnect(true);
          return;
        }
        socket.userId = user.id;
        socket.join(`user:${user.id}`);
        logger.info('WebSocket client connected', { socketId: socket.id, userId: user.id });
      } catch (err) {
        logger.debug('WebSocket auth failed', { socketId: socket.id, error: err.message });
        socket.disconnect(true);
        return;
      }

      // Compat: old clients emit join(userId); only allow own room.
      socket.on('join', (requestedId) => {
        if (socket.userId != null && String(requestedId) === String(socket.userId)) {
          socket.join(`user:${socket.userId}`);
        }
      });
      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', { socketId: socket.id });
      });
    });

    // Roulette overlay: connect with ?key=API_KEY; server joins socket to user room and sends initial state
    rouletteNs = io.of('/roulette');
    rouletteNs.on('connection', async (socket) => {
      const key = (socket.handshake.query?.key || socket.handshake.auth?.key || '').trim();
      if (!key) {
        logger.debug('Roulette overlay connection without key');
        socket.disconnect(true);
        return;
      }
      try {
        const user = await User.findOne({
          where: { nightbotApiKey: key },
          attributes: ['id'],
        });
        if (!user) {
          socket.disconnect(true);
          return;
        }
        socket.join(`user:${user.id}`);
        socket.userId = user.id;
        const rouletteService = (await import('../modules/content/application/rouletteService.js')).default;
        const players = rouletteService.getState(user.id);
        socket.emit('roulette_players', { players });
        logger.debug('Roulette overlay joined room', { userId: user.id, socketId: socket.id, playersCount: players.length });
      } catch (err) {
        logger.warn('Roulette overlay auth failed', { error: err.message });
        socket.disconnect(true);
      }
      socket.on('disconnect', () => {});
    });

    pollNs = io.of('/poll');
    pollNs.on('connection', async (socket) => {
      const key = (socket.handshake.query?.key || socket.handshake.auth?.key || '').trim();
      if (!key) {
        socket.disconnect(true);
        return;
      }
      try {
        const user = await User.findOne({
          where: { nightbotApiKey: key },
          attributes: ['id'],
        });
        if (!user) {
          socket.disconnect(true);
          return;
        }
        socket.join(`user:${user.id}`);
        socket.userId = user.id;
        const pollService = (await import('../modules/content/application/pollService.js')).default;
        socket.emit('poll_state', pollService.getPublicState(user.id));
        logger.debug('Poll overlay joined room', { userId: user.id, socketId: socket.id });
      } catch (err) {
        logger.warn('Poll overlay auth failed', { error: err.message });
        socket.disconnect(true);
      }
      socket.on('disconnect', () => {});
    });

    wsAvailable = true;
    logger.info('WebSocket service initialized (main + roulette + poll)');
  } catch (error) {
    logger.warn('WebSocket not available (socket.io not installed)', { error: error.message });
  }
}

/**
 * Emit to roulette overlay clients for a given user (room user:userId in /roulette namespace)
 */
export function emitRouletteToUser(userId, event, data) {
  if (!wsAvailable || !rouletteNs) {
    logger.debug('Roulette WebSocket not available', { userId, event });
    return;
  }
  try {
    rouletteNs.to(`user:${userId}`).emit(event, data);
    logger.debug('Roulette event emitted', { userId, event });
  } catch (error) {
    logger.warn('Roulette emit error', { userId, event, error: error.message });
  }
}

export function emitPollToUser(userId, event, data) {
  if (!wsAvailable || !pollNs) {
    logger.debug('Poll WebSocket not available', { userId, event });
    return;
  }
  try {
    pollNs.to(`user:${userId}`).emit(event, data);
    logger.debug('Poll event emitted', { userId, event });
  } catch (error) {
    logger.warn('Poll emit error', { userId, event, error: error.message });
  }
}

/**
 * Emit event to user
 */
export function emitToUser(userId, event, data) {
  if (!wsAvailable || !io) {
    logger.debug('WebSocket not available, skipping notification', { userId, event });
    return;
  }
  
  try {
    io.to(`user:${userId}`).emit(event, data);
    logger.debug('WebSocket event emitted', { userId, event });
  } catch (error) {
    logger.warn('WebSocket emit error', { userId, event, error: error.message });
  }
}

/**
 * Emit content published notification
 */
export function notifyContentPublished(userId, content) {
  emitToUser(userId, 'content-published', {
    contentId: content.id,
    title: content.title,
    platforms: content.platforms,
    status: 'success',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit content failed notification
 */
export function notifyContentFailed(userId, content, error) {
  emitToUser(userId, 'content-failed', {
    contentId: content.id,
    title: content.title,
    platforms: content.platforms,
    error: error.message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if WebSocket is available
 */
export function isWebSocketAvailable() {
  return wsAvailable;
}

export function isWebSocketPubSubEnabled() {
  return wsPubSubEnabled;
}
