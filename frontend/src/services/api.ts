import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  LoginCredentials,
  SignupData,
  User,
  Board,
  CreateBoardData,
  List,
  CreateListData,
  Task,
  CreateTaskData,
  UpdateTaskData,
  MoveTaskData,
  Activity,
  Comment,
} from '../types';

// Detect if running in GitHub Codespace and construct API URL
function getAPIURL(): string {
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL) return envURL;

  // If running in Codespace, construct the backend URL from the frontend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('.github.dev')) {
    // Replace port 3000 (frontend) with port 5000 (backend) in the Codespace URL
    const backendURL = window.location.origin.replace(':3000', ':5000').replace('-3000.', '-5000.');
    console.log('Detected Codespace environment. Backend URL:', backendURL);
    return backendURL;
  }

  // Default to /api for local development (uses vite proxy)
  return '/api';
}

const API_URL = getAPIURL();

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await this.client.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      credentials
    );
    return response.data.data!;
  }

  async signup(data: SignupData): Promise<{ user: User; token: string }> {
    const response = await this.client.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/signup',
      data
    );
    return response.data.data!;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  }

  async updateProfile(data: { name?: string; avatar?: string }): Promise<User> {
    const response = await this.client.put<ApiResponse<User>>('/auth/profile', data);
    return response.data.data!;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await this.client.get<ApiResponse<User[]>>(
      `/auth/users/search?query=${encodeURIComponent(query)}`
    );
    return response.data.data || [];
  }

  // Board endpoints
  async getBoards(params?: { page?: number; limit?: number; query?: string }): Promise<{
    boards: Board[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.query) queryParams.append('query', params.query);

    const response = await this.client.get<ApiResponse<Board[]>>(
      `/boards?${queryParams.toString()}`
    );
    return {
      boards: response.data.data || [],
      pagination: response.data.pagination,
    };
  }

  async getBoard(id: string): Promise<Board> {
    const response = await this.client.get<ApiResponse<Board>>(`/boards/${id}`);
    return response.data.data!;
  }

  async createBoard(data: CreateBoardData): Promise<Board> {
    const response = await this.client.post<ApiResponse<Board>>('/boards', data);
    return response.data.data!;
  }

  async updateBoard(id: string, data: Partial<CreateBoardData & { isArchived?: boolean }>): Promise<Board> {
    const response = await this.client.put<ApiResponse<Board>>(`/boards/${id}`, data);
    return response.data.data!;
  }

  async deleteBoard(id: string): Promise<void> {
    await this.client.delete(`/boards/${id}`);
  }

  async addBoardMember(boardId: string, email: string, role: string = 'member'): Promise<void> {
    await this.client.post(`/boards/${boardId}/members`, { email, role });
  }

  async removeBoardMember(boardId: string, memberId: string): Promise<void> {
    await this.client.delete(`/boards/${boardId}/members/${memberId}`);
  }

  async getBoardActivities(boardId: string, page: number = 1): Promise<{
    activities: Activity[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await this.client.get<ApiResponse<Activity[]>>(
      `/boards/${boardId}/activities?page=${page}`
    );
    return {
      activities: response.data.data || [],
      pagination: response.data.pagination,
    };
  }

  // List endpoints
  async createList(data: CreateListData): Promise<List> {
    const response = await this.client.post<ApiResponse<List>>('/lists', data);
    return response.data.data!;
  }

  async updateList(id: string, data: { name?: string }): Promise<List> {
    const response = await this.client.put<ApiResponse<List>>(`/lists/${id}`, data);
    return response.data.data!;
  }

  async deleteList(id: string): Promise<void> {
    await this.client.delete(`/lists/${id}`);
  }

  async reorderLists(boardId: string, listIds: string[]): Promise<List[]> {
    const response = await this.client.put<ApiResponse<List[]>>(
      `/lists/board/${boardId}/reorder`,
      { listIds }
    );
    return response.data.data || [];
  }

  // Task endpoints
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await this.client.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data!;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.client.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data!;
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await this.client.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data!;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }

  async moveTask(id: string, data: MoveTaskData): Promise<Task> {
    const response = await this.client.put<ApiResponse<Task>>(`/tasks/${id}/move`, data);
    return response.data.data!;
  }

  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    const response = await this.client.post<ApiResponse<Task>>(
      `/tasks/${taskId}/assignees`,
      { assigneeId }
    );
    return response.data.data!;
  }

  async unassignTask(taskId: string, assigneeId: string): Promise<Task> {
    const response = await this.client.delete<ApiResponse<Task>>(
      `/tasks/${taskId}/assignees/${assigneeId}`
    );
    return response.data.data!;
  }

  async addComment(taskId: string, content: string): Promise<Comment> {
    const response = await this.client.post<ApiResponse<Comment>>(
      `/tasks/${taskId}/comments`,
      { content }
    );
    return response.data.data!;
  }

  async searchTasks(params: {
    query?: string;
    boardId?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: Task[]; pagination?: { page: number; limit: number; total: number } }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await this.client.get<ApiResponse<Task[]>>(
      `/tasks/search?${queryParams.toString()}`
    );
    return {
      tasks: response.data.data || [],
      pagination: response.data.pagination,
    };
  }
}

export const api = new ApiService();
