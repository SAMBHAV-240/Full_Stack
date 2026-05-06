import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

const prisma = new PrismaClient();

/**
 * Register a new user
 */
export async function signup(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email, user.name);

    sendSuccess(
      res,
      {
        user,
        token,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Signup error:', error);
    sendError(res, 'Failed to register user', 500);
  }
}

/**
 * Login user
 */
export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.name);

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Failed to login', 500);
  }
}

/**
 * Get current user profile
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedBoards: true,
            boardMembers: true,
            assignedTasks: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Failed to get profile', 500);
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, avatar } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Failed to update profile', 500);
  }
}

/**
 * Change password
 */
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      sendError(res, 'Current password is incorrect', 401);
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', 500);
  }
}

/**
 * Search users (for assigning to tasks/boards)
 */
export async function searchUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      sendSuccess(res, []);
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
      take: Math.min(Number(limit), 20),
    });

    sendSuccess(res, users);
  } catch (error) {
    console.error('Search users error:', error);
    sendError(res, 'Failed to search users', 500);
  }
}

/**
 * Generate JWT token
 */
function generateToken(id: string, email: string, name: string): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

  return jwt.sign({ id, email, name }, secret, { expiresIn });
}
