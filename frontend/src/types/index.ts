// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name: string;
}

// Board types
export interface Board {
  id: string;
  name: string;
  description?: string | null;
  background: string;
  isArchived: boolean;
  ownerId: string;
  owner: User;
  members: BoardMember[];
  lists?: List[];
  createdAt: string;
  updatedAt: string;
  onlineUsers?: string[];
  _count?: {
    lists: number;
  };
}

export interface BoardMember {
  id: string;
  role: 'owner' | 'admin' | 'member';
  userId: string;
  user: User;
  boardId: string;
  createdAt: string;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  background?: string;
}

// List types
export interface List {
  id: string;
  name: string;
  position: number;
  boardId: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateListData {
  name: string;
  boardId: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string | null;
  labels?: string | null; // JSON string
  isArchived: boolean;
  listId: string;
  list?: {
    id: string;
    name: string;
    boardId: string;
    board?: {
      name: string;
    };
  };
  assignees: TaskAssignee[];
  comments?: Comment[];
  _count?: {
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignee {
  id: string;
  userId: string;
  user: User;
  taskId: string;
  assignedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  listId: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  labels?: string[];
  assigneeIds?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string | null;
  labels?: string[];
  isArchived?: boolean;
}

export interface MoveTaskData {
  listId: string;
  position: number;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  userId: string;
  user: User;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

// Activity types
export interface Activity {
  id: string;
  action: string;
  entityType: 'board' | 'list' | 'task';
  entityId: string;
  description: string;
  metadata?: string | null;
  userId: string;
  user: User;
  boardId?: string | null;
  board?: {
    id: string;
    name: string;
  };
  taskId?: string | null;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
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

// Redux state types
export interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
}

export interface TaskState {
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  taskModalOpen: boolean;
  createBoardModalOpen: boolean;
  createListModalOpen: boolean;
}
