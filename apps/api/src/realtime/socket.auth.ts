import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AuthenticatedUser, JwtAccessPayload } from '../middleware/auth.middleware.js';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
    projectRooms?: Set<string>;
    docRooms?: Set<string>;
    whiteboardRooms?: Set<string>;
  };
}

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    let token = (socket.handshake.auth?.token as string | undefined) || undefined;

    if (!token && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token && socket.handshake.headers.cookie) {
      const cookieHeader = socket.handshake.headers.cookie;
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      logger.warn('Socket.IO handshake rejeitado: Token ausente');
      return next(new Error('AUTH_TOKEN_REQUIRED'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtAccessPayload;
    if (!decoded || !decoded.sub) {
      return next(new Error('INVALID_AUTH_TOKEN'));
    }

    (socket as AuthenticatedSocket).data.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
    (socket as AuthenticatedSocket).data.projectRooms = new Set<string>();
    (socket as AuthenticatedSocket).data.docRooms = new Set<string>();
    (socket as AuthenticatedSocket).data.whiteboardRooms = new Set<string>();

    return next();
  } catch (error) {
    logger.warn({ error }, 'Falha na autenticação do Socket.IO');
    return next(new Error('AUTHENTICATION_FAILED'));
  }
};
