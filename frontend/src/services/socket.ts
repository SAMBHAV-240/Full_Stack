import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateBoardFromSocket, updateListFromSocket, updateTaskFromSocket } from '../store/slices/boardSlice';
import toast from 'react-hot-toast';

// Detect if running in GitHub Codespace and construct Socket URL
function getSocketURL(): string {
  const envURL = import.meta.env.VITE_SOCKET_URL;
  if (envURL) return envURL;

  // If running in Codespace, construct the backend URL from the frontend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('.github.dev')) {
    // Replace port 3000 (frontend) with port 5000 (backend) in the Codespace URL
    // Convert https to wss for WebSocket
    const baseURL = window.location.origin.replace(':3000', ':5000').replace('-3000.', '-5000.');
    const socketURL = baseURL.replace('https://', 'wss://').replace('http://', 'ws://');
    console.log('Detected Codespace environment. Socket URL:', socketURL);
    return socketURL;
  }

  // Default to localhost for local development
  return 'http://localhost:5000';
}

const SOCKET_URL = getSocketURL();

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      if (this.currentBoardId) {
        this.joinBoard(this.currentBoardId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Board events
    this.socket.on('board:update', (data) => {
      store.dispatch(updateBoardFromSocket(data));
    });

    // List events
    this.socket.on('list:create', (data) => {
      store.dispatch(updateListFromSocket({ type: 'create', data }));
    });

    this.socket.on('list:update', (data) => {
      store.dispatch(updateListFromSocket({ type: 'update', data }));
    });

    this.socket.on('list:delete', (data) => {
      store.dispatch(updateListFromSocket({ type: 'delete', data }));
    });

    this.socket.on('list:reorder', (data) => {
      store.dispatch(updateListFromSocket({ type: 'reorder', data }));
    });

    // Task events
    this.socket.on('task:create', (data) => {
      store.dispatch(updateTaskFromSocket({ type: 'create', data }));
    });

    this.socket.on('task:update', (data) => {
      store.dispatch(updateTaskFromSocket({ type: 'update', data }));
    });

    this.socket.on('task:delete', (data) => {
      store.dispatch(updateTaskFromSocket({ type: 'delete', data }));
    });

    this.socket.on('task:move', (data) => {
      store.dispatch(updateTaskFromSocket({ type: 'move', data }));
    });

    // Member events
    this.socket.on('member:join', (data) => {
      toast.success(`${data.userName} joined the board`, { duration: 2000 });
    });

    this.socket.on('member:leave', (data) => {
      toast(`${data.userName} left the board`, { duration: 2000 });
    });

    // Activity events
    this.socket.on('activity:new', (data) => {
      console.log('New activity:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
    }
  }

  joinBoard(boardId: string): void {
    if (this.socket?.connected) {
      if (this.currentBoardId && this.currentBoardId !== boardId) {
        this.socket.emit('board:leave', this.currentBoardId);
      }
      this.socket.emit('board:join', boardId);
      this.currentBoardId = boardId;
    }
  }

  leaveBoard(boardId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('board:leave', boardId);
      if (this.currentBoardId === boardId) {
        this.currentBoardId = null;
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
