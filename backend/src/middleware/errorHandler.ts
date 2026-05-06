import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response';

/**
 * Handle validation errors from express-validator
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      if ('path' in err) {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    });
    sendError(res, errorMessages.join(', '), 400);
    return;
  }
  
  next();
}

/**
 * Global error handler
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    sendError(res, 'A record with this value already exists', 409);
    return;
  }
  
  if (err.code === 'P2025') {
    sendError(res, 'Record not found', 404);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  sendError(res, message, statusCode);
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}
