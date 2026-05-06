import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { activityService } from '../services/activityService';
import { socketService } from '../services/socketService';
import { isBoardMember } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Create a new list
 */
export async function createList(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, boardId } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check board membership
    if (!(await isBoardMember(userId, boardId))) {
      sendError(res, 'Board not found or access denied', 404);
      return;
    }

    // Get the highest position in the board
    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (lastList?.position ?? -1) + 1;

    const list = await prisma.list.create({
      data: {
        name,
        boardId,
        position,
      },
      include: {
        tasks: true,
      },
    });

    // Get board name for activity
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { name: true },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'created',
      entityType: 'list',
      entityId: list.id,
      description: `created list "${list.name}" in board "${board?.name}"`,
      boardId,
    });

    // Emit real-time update
    socketService.emitToBoard(boardId, 'list:create', list);

    sendSuccess(res, list, 'List created successfully', 201);
  } catch (error) {
    console.error('Create list error:', error);
    sendError(res, 'Failed to create list', 500);
  }
}

/**
 * Update a list
 */
export async function updateList(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get list and check membership
    const existingList = await prisma.list.findUnique({
      where: { id },
      select: { boardId: true },
    });

    if (!existingList) {
      sendError(res, 'List not found', 404);
      return;
    }

    if (!(await isBoardMember(userId, existingList.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const list = await prisma.list.update({
      where: { id },
      data: { name },
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
          },
        },
      },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'updated',
      entityType: 'list',
      entityId: list.id,
      description: `renamed list to "${list.name}"`,
      boardId: existingList.boardId,
    });

    // Emit real-time update
    socketService.emitToBoard(existingList.boardId, 'list:update', list);

    sendSuccess(res, list, 'List updated successfully');
  } catch (error) {
    console.error('Update list error:', error);
    sendError(res, 'Failed to update list', 500);
  }
}

/**
 * Delete a list
 */
export async function deleteList(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get list and check membership
    const existingList = await prisma.list.findUnique({
      where: { id },
      select: { boardId: true, name: true },
    });

    if (!existingList) {
      sendError(res, 'List not found', 404);
      return;
    }

    if (!(await isBoardMember(userId, existingList.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    await prisma.list.delete({
      where: { id },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'deleted',
      entityType: 'list',
      entityId: id,
      description: `deleted list "${existingList.name}"`,
      boardId: existingList.boardId,
    });

    // Emit real-time update
    socketService.emitToBoard(existingList.boardId, 'list:delete', { id });

    sendSuccess(res, null, 'List deleted successfully');
  } catch (error) {
    console.error('Delete list error:', error);
    sendError(res, 'Failed to delete list', 500);
  }
}

/**
 * Reorder lists within a board
 */
export async function reorderLists(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { boardId } = req.params;
    const { listIds } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, boardId))) {
      sendError(res, 'Board not found or access denied', 404);
      return;
    }

    // Update positions in transaction
    await prisma.$transaction(
      listIds.map((listId: string, index: number) =>
        prisma.list.update({
          where: { id: listId },
          data: { position: index },
        })
      )
    );

    // Get updated lists
    const lists = await prisma.list.findMany({
      where: { boardId },
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
          },
        },
      },
    });

    // Emit real-time update
    socketService.emitToBoard(boardId, 'list:reorder', { lists });

    sendSuccess(res, lists, 'Lists reordered successfully');
  } catch (error) {
    console.error('Reorder lists error:', error);
    sendError(res, 'Failed to reorder lists', 500);
  }
}
