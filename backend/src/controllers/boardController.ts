import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, parsePaginationParams, calculatePagination } from '../utils/response';
import { activityService } from '../services/activityService';
import { socketService } from '../services/socketService';
import { isBoardMember, isBoardOwner, isBoardAdmin } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Create a new board
 */
export async function createBoard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, description, background } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const board = await prisma.board.create({
      data: {
        name,
        description,
        background: background || '#1e3a5f',
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
        // Create default lists
        lists: {
          create: [
            { name: 'To Do', position: 0 },
            { name: 'In Progress', position: 1 },
            { name: 'Done', position: 2 },
          ],
        },
      },
      include: {
        lists: { orderBy: { position: 'asc' } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'created',
      entityType: 'board',
      entityId: board.id,
      description: `created board "${board.name}"`,
      boardId: board.id,
    });

    sendSuccess(res, board, 'Board created successfully', 201);
  } catch (error) {
    console.error('Create board error:', error);
    sendError(res, 'Failed to create board', 500);
  }
}

/**
 * Get all boards for current user
 */
export async function getBoards(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { query, archived } = req.query;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Build where clause
    const where: any = {
      members: {
        some: { userId },
      },
      isArchived: archived === 'true',
    };

    if (query && typeof query === 'string') {
      where.name = { contains: query };
    }

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          _count: {
            select: { lists: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.board.count({ where }),
    ]);

    sendSuccess(
      res,
      boards,
      undefined,
      200,
      calculatePagination(page, limit, total)
    );
  } catch (error) {
    console.error('Get boards error:', error);
    sendError(res, 'Failed to get boards', 500);
  }
}

/**
 * Get a specific board with all details
 */
export async function getBoard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, id))) {
      sendError(res, 'Board not found or access denied', 404);
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        lists: {
          where: { board: { isArchived: false } },
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              where: { isArchived: false },
              orderBy: { position: 'asc' },
              include: {
                assignees: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, avatar: true },
                    },
                  },
                },
                _count: {
                  select: { comments: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      sendError(res, 'Board not found', 404);
      return;
    }

    // Get online users
    const onlineUsers = socketService.getOnlineUsersInBoard(id);

    sendSuccess(res, { ...board, onlineUsers });
  } catch (error) {
    console.error('Get board error:', error);
    sendError(res, 'Failed to get board', 500);
  }
}

/**
 * Update a board
 */
export async function updateBoard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, background, isArchived } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, id))) {
      sendError(res, 'Board not found or access denied', 404);
      return;
    }

    const board = await prisma.board.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(background && { background }),
        ...(isArchived !== undefined && { isArchived }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'updated',
      entityType: 'board',
      entityId: board.id,
      description: `updated board "${board.name}"`,
      boardId: board.id,
    });

    // Emit real-time update
    socketService.emitToBoard(id, 'board:update', board);

    sendSuccess(res, board, 'Board updated successfully');
  } catch (error) {
    console.error('Update board error:', error);
    sendError(res, 'Failed to update board', 500);
  }
}

/**
 * Delete a board
 */
export async function deleteBoard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check ownership
    if (!(await isBoardOwner(userId, id))) {
      sendError(res, 'Only board owner can delete the board', 403);
      return;
    }

    await prisma.board.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Board deleted successfully');
  } catch (error) {
    console.error('Delete board error:', error);
    sendError(res, 'Failed to delete board', 500);
  }
}

/**
 * Add member to board
 */
export async function addBoardMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check if current user is admin or owner
    if (!(await isBoardAdmin(userId, id))) {
      sendError(res, 'Only board owner or admin can add members', 403);
      return;
    }

    // Find user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!userToAdd) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Check if already a member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: { userId: userToAdd.id, boardId: id },
      },
    });

    if (existingMember) {
      sendError(res, 'User is already a member of this board', 409);
      return;
    }

    // Add member
    const member = await prisma.boardMember.create({
      data: {
        userId: userToAdd.id,
        boardId: id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Get board name for activity
    const board = await prisma.board.findUnique({
      where: { id },
      select: { name: true },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'added_member',
      entityType: 'board',
      entityId: id,
      description: `added ${userToAdd.name} to board "${board?.name}"`,
      boardId: id,
    });

    // Emit real-time update
    socketService.emitToBoard(id, 'member:join', {
      member,
      boardId: id,
    });

    sendSuccess(res, member, 'Member added successfully', 201);
  } catch (error) {
    console.error('Add board member error:', error);
    sendError(res, 'Failed to add member', 500);
  }
}

/**
 * Remove member from board
 */
export async function removeBoardMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id, memberId } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check ownership (only owner can remove members)
    if (!(await isBoardOwner(userId, id))) {
      sendError(res, 'Only board owner can remove members', 403);
      return;
    }

    // Can't remove the owner
    const board = await prisma.board.findUnique({
      where: { id },
      select: { ownerId: true, name: true },
    });

    if (board?.ownerId === memberId) {
      sendError(res, 'Cannot remove board owner', 400);
      return;
    }

    await prisma.boardMember.delete({
      where: {
        userId_boardId: { userId: memberId, boardId: id },
      },
    });

    // Log activity
    const removedUser = await prisma.user.findUnique({
      where: { id: memberId },
      select: { name: true },
    });

    await activityService.createActivity(userId, {
      action: 'removed_member',
      entityType: 'board',
      entityId: id,
      description: `removed ${removedUser?.name} from board "${board?.name}"`,
      boardId: id,
    });

    // Emit real-time update
    socketService.emitToBoard(id, 'member:leave', {
      userId: memberId,
      boardId: id,
    });

    sendSuccess(res, null, 'Member removed successfully');
  } catch (error) {
    console.error('Remove board member error:', error);
    sendError(res, 'Failed to remove member', 500);
  }
}

/**
 * Get board activities
 */
export async function getBoardActivities(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { page, limit } = parsePaginationParams(req.query);

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, id))) {
      sendError(res, 'Board not found or access denied', 404);
      return;
    }

    const result = await activityService.getBoardActivities(id, page, limit);

    sendSuccess(res, result.activities, undefined, 200, result.pagination);
  } catch (error) {
    console.error('Get board activities error:', error);
    sendError(res, 'Failed to get activities', 500);
  }
}
