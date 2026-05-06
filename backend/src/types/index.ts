import { Request } from 'express';

// User types
export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Board types
export interface CreateBoardInput {
  name: string;
  description?: string;
  background?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
  background?: string;
  isArchived?: boolean;
}

// List types
export interface CreateListInput {
  name: string;
  boardId: string;
  position?: number;
}

export interface UpdateListInput {
  name?: string;
  position?: number;
}

export interface ReorderListsInput {
  listIds: string[];
}

// Task types
export interface CreateTaskInput {
  title: string;
  description?: string;
  listId: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  labels?: string[];
  assigneeIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string | null;
  labels?: string[];
  isArchived?: boolean;
}

export interface MoveTaskInput {
  listId: string;
  position: number;
}

// Activity types
export interface CreateActivityInput {
  action: string;
  entityType: 'board' | 'list' | 'task';
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  boardId?: string;
  taskId?: string;
}

// WebSocket event types
export interface SocketEventPayload {
  boardId: string;
  userId: string;
  data: any;
}

export type SocketEventType =
  | 'board:update'
  | 'list:create'
  | 'list:update'
  | 'list:delete'
  | 'list:reorder'
  | 'task:create'
  | 'task:update'
  | 'task:delete'
  | 'task:move'
  | 'member:join'
  | 'member:leave'
  | 'activity:new';

// Search and filter types
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskSearchParams extends SearchParams {
  priority?: string;
  assigneeId?: string;
  listId?: string;
  hasAssignee?: boolean;
  isArchived?: boolean;
}
