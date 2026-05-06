import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserPayload, SocketEventType, SocketEventPayload } from '../types';

interface AuthenticatedSocket extends Socket {
  user?: UserPayload;
  boardRooms: Set<string>;
}

class SocketService {
  private io: Server | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  /**
   * Initialize Socket.io server
   */
  initialize(server: HttpServer): Server {
    // Configure CORS with support for multiple origins and patterns (for Codespace)
    const corsOriginConfig = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    const corsFn = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      for (const allowedOrigin of corsOriginConfig) {
        const trimmed = allowedOrigin.trim();
        
        if (origin === trimmed) {
          return callback(null, true);
        }
        
        if (trimmed.includes('*')) {
          const pattern = trimmed.replace('*', '.*');
          if (new RegExp(`^https://${pattern}$`).test(origin) || new RegExp(`^http://${pattern}$`).test(origin)) {
            return callback(null, true);
          }
        }
      }
      
      callback(new Error('CORS not allowed'));
    };

    this.io = new Server(server, {
      cors: {
        origin: corsFn as any,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      const authSocket = socket as AuthenticatedSocket;
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const decoded = jwt.verify(token as string, secret) as UserPayload;
        
        authSocket.user = decoded;
        authSocket.boardRooms = new Set();
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket as AuthenticatedSocket);
    });

    console.log('🔌 Socket.io initialized');
    return this.io;
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.user?.id;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${socket.user?.name} (${socket.id})`);

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)?.add(socket.id);

    // Join board room
    socket.on('board:join', (boardId: string) => {
      socket.join(`board:${boardId}`);
      socket.boardRooms.add(boardId);
      console.log(`User ${socket.user?.name} joined board ${boardId}`);
      
      // Notify others in the board
      socket.to(`board:${boardId}`).emit('member:join', {
        userId,
        userName: socket.user?.name,
        boardId,
      });
    });

    // Leave board room
    socket.on('board:leave', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      socket.boardRooms.delete(boardId);
      console.log(`User ${socket.user?.name} left board ${boardId}`);
      
      socket.to(`board:${boardId}`).emit('member:leave', {
        userId,
        userName: socket.user?.name,
        boardId,
      });
    });

    // Handle cursor/presence updates (optional real-time feature)
    socket.on('cursor:move', (data: { boardId: string; x: number; y: number }) => {
      socket.to(`board:${data.boardId}`).emit('cursor:update', {
        userId,
        userName: socket.user?.name,
        x: data.x,
        y: data.y,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.name} (${socket.id})`);
      
      // Remove from connected users
      this.connectedUsers.get(userId)?.delete(socket.id);
      if (this.connectedUsers.get(userId)?.size === 0) {
        this.connectedUsers.delete(userId);
      }

      // Notify all boards user was in
      socket.boardRooms.forEach((boardId) => {
        this.io?.to(`board:${boardId}`).emit('member:leave', {
          userId,
          userName: socket.user?.name,
          boardId,
        });
      });
    });
  }

  /**
   * Emit event to a specific board room
   */
  emitToBoard(boardId: string, event: SocketEventType, data: any): void {
    if (this.io) {
      this.io.to(`board:${boardId}`).emit(event, data);
    }
  }

  /**
   * Emit event to a specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    const socketIds = this.connectedUsers.get(userId);
    if (this.io && socketIds) {
      socketIds.forEach((socketId) => {
        this.io?.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Get online users for a board
   */
  getOnlineUsersInBoard(boardId: string): string[] {
    const room = this.io?.sockets.adapter.rooms.get(`board:${boardId}`);
    if (!room) return [];

    const userIds: string[] = [];
    room.forEach((socketId) => {
      const socket = this.io?.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.user?.id && !userIds.includes(socket.user.id)) {
        userIds.push(socket.user.id);
      }
    });
    return userIds;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get Socket.io instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

// Export singleton instance
export const socketService = new SocketService();
