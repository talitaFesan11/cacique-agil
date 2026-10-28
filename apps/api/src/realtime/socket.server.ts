import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { socketAuthMiddleware, AuthenticatedSocket } from './socket.auth.js';
import { registerRoomHandlers } from './socket.rooms.js';
import { socketEmitter } from './socket.emitter.js';

export const initSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;

    logger.info(
      { userId: user?.id, socketId: socket.id },
      'Cliente conectado ao Socket.IO',
    );

    registerRoomHandlers(io, socket);
  });

  socketEmitter.setServer(io);

  return io;
};
