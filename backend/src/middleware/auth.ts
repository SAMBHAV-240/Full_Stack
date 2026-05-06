import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserPayload } from '../types';
import { sendError } from '../utils/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authentication middleware - verifies JWT token
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Access token required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      sendError(res, 'Access token required', 401);
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as UserPayload;

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      sendError(res, 'User no longer exists', 401);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token expired', 401);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Invalid token', 401);
      return;
    }
    sendError(res, 'Authentication failed', 401);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as UserPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}

/**
 * Check if user is a member of a board
 */
export async function isBoardMember(
  userId: string,
  boardId: string
): Promise<boolean> {
  const membership = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: { userId, boardId },
    },
  });
  return !!membership;
}

/**
 * Check if user is board admin or owner
 */
export async function isBoardAdmin(
  userId: string,
  boardId: string
): Promise<boolean> {
  const membership = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: { userId, boardId },
    },
  });
  return membership?.role === 'owner' || membership?.role === 'admin';
}

/**
 * Check if user is board owner
 */
export async function isBoardOwner(
  userId: string,
  boardId: string
): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });
  return board?.ownerId === userId;
}
