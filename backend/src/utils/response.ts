import { Response } from 'express';
import { ApiResponse, PaginationInfo } from '../types';

/**
 * Send a successful response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  pagination?: PaginationInfo
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    pagination,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400
): Response {
  const response: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(response);
}

/**
 * Calculate pagination info
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse pagination params from query
 */
export function parsePaginationParams(query: any): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Parse sort params from query
 */
export function parseSortParams(
  query: any,
  allowedFields: string[] = ['createdAt', 'updatedAt', 'name', 'title']
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { sortBy, sortOrder };
}

/**
 * Async handler wrapper for error handling
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Generate a random color for board backgrounds
 */
export function generateRandomColor(): string {
  const colors = [
    '#1e3a5f', '#2d5a3d', '#5a2d2d', '#4a3d5a',
    '#3d4a5a', '#5a4a3d', '#2d4a5a', '#5a3d4a',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
