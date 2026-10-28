import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/auth-store';

let socketInstance: Socket | null = null;
let currentToken: string | null = null;

export const getSocketUrl = (): string => {
  if (typeof process.env.NEXT_PUBLIC_SOCKET_URL === 'string' && process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const url = new URL(apiUrl);
      return url.origin;
    } catch {
      return 'http://localhost:4000';
    }
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
};

export const getSocket = (explicitToken?: string | null): Socket | null => {
  if (typeof window === 'undefined') return null;

  const token =
    explicitToken ||
    useAuthStore.getState().accessToken ||
    window.localStorage.getItem('fluxopro_access_token');

  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      currentToken = null;
    }
    return null;
  }

  // Se o token mudou ou ainda não há instância, reconecta
  if (!socketInstance || currentToken !== token) {
    if (socketInstance) {
      socketInstance.disconnect();
    }

    const socketUrl = getSocketUrl();
    currentToken = token;

    socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      withCredentials: true,
    });
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentToken = null;
  }
};
