import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, parsePaginationParams, calculatePagination } from '../utils/response';
import { activityService } from '../services/activityService';
import { socketService } from '../services/socketService';
import { isBoardMember } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Create a new task
 */
export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { title, description, listId, priority, dueDate, labels, assigneeIds } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get list and board info
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { board: { select: { id: true, name: true } } },
    });

    if (!list) {
      sendError(res, 'List not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    // Get highest position in the list
    const lastTask = await prisma.task.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (lastTask?.position ?? -1) + 1;

    // Create task with assignees
    const task = await prisma.task.create({
      data: {
        title,
        description,
        listId,
        position,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels ? JSON.stringify(labels) : null,
        assignees: assigneeIds?.length
          ? {
              create: assigneeIds.map((id: string) => ({ userId: id })),
            }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        list: {
          select: { id: true, name: true, boardId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'created',
      entityType: 'task',
      entityId: task.id,
      description: `created task "${task.title}" in list "${list.name}"`,
      boardId: list.boardId,
      taskId: task.id,
    });

    // Emit real-time update
    socketService.emitToBoard(list.boardId, 'task:create', task);

    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    console.error('Create task error:', error);
    sendError(res, 'Failed to create task', 500);
  }
}

/**
 * Get a single task with details
 */
export async function getTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        list: {
          select: { id: true, name: true, boardId: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, task.list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    sendSuccess(res, task);
  } catch (error) {
    console.error('Get task error:', error);
    sendError(res, 'Failed to get task', 500);
  }
}

/**
 * Update a task
 */
export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, description, priority, dueDate, labels, isArchived } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, existingTask.list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(labels && { labels: JSON.stringify(labels) }),
        ...(isArchived !== undefined && { isArchived }),
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        list: {
          select: { id: true, name: true, boardId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'updated',
      entityType: 'task',
      entityId: task.id,
      description: `updated task "${task.title}"`,
      boardId: existingTask.list.boardId,
      taskId: task.id,
    });

    // Emit real-time update
    socketService.emitToBoard(existingTask.list.boardId, 'task:update', task);

    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    console.error('Update task error:', error);
    sendError(res, 'Failed to update task', 500);
  }
}

/**
 * Delete a task
 */
export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true, name: true } } },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, existingTask.list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'deleted',
      entityType: 'task',
      entityId: id,
      description: `deleted task "${existingTask.title}"`,
      boardId: existingTask.list.boardId,
    });

    // Emit real-time update
    socketService.emitToBoard(existingTask.list.boardId, 'task:delete', {
      id,
      listId: existingTask.listId,
    });

    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    console.error('Delete task error:', error);
    sendError(res, 'Failed to delete task', 500);
  }
}

/**
 * Move task to different list/position
 */
export async function moveTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { listId, position } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { list: { select: { id: true, name: true, boardId: true } } },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, existingTask.list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    // Verify target list exists and is in the same board
    const targetList = await prisma.list.findUnique({
      where: { id: listId },
      select: { id: true, name: true, boardId: true },
    });

    if (!targetList) {
      sendError(res, 'Target list not found', 404);
      return;
    }

    if (targetList.boardId !== existingTask.list.boardId) {
      sendError(res, 'Cannot move task to a different board', 400);
      return;
    }

    const sourceListId = existingTask.listId;
    const isMovingToNewList = sourceListId !== listId;

    // Reorder tasks in transaction
    await prisma.$transaction(async (tx) => {
      if (isMovingToNewList) {
        // Update positions in source list (tasks below moved task go up)
        await tx.task.updateMany({
          where: {
            listId: sourceListId,
            position: { gt: existingTask.position },
            isArchived: false,
          },
          data: {
            position: { decrement: 1 },
          },
        });

        // Update positions in target list (make room for new task)
        await tx.task.updateMany({
          where: {
            listId,
            position: { gte: position },
            isArchived: false,
          },
          data: {
            position: { increment: 1 },
          },
        });
      } else {
        // Moving within same list
        if (position > existingTask.position) {
          // Moving down
          await tx.task.updateMany({
            where: {
              listId,
              position: { gt: existingTask.position, lte: position },
              id: { not: id },
              isArchived: false,
            },
            data: {
              position: { decrement: 1 },
            },
          });
        } else if (position < existingTask.position) {
          // Moving up
          await tx.task.updateMany({
            where: {
              listId,
              position: { gte: position, lt: existingTask.position },
              id: { not: id },
              isArchived: false,
            },
            data: {
              position: { increment: 1 },
            },
          });
        }
      }

      // Update the moved task
      await tx.task.update({
        where: { id },
        data: {
          listId,
          position,
        },
      });
    });

    // Get updated task
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        list: {
          select: { id: true, name: true, boardId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Log activity
    const actionDesc = isMovingToNewList
      ? `moved task "${existingTask.title}" from "${existingTask.list.name}" to "${targetList.name}"`
      : `reordered task "${existingTask.title}" in "${targetList.name}"`;

    await activityService.createActivity(userId, {
      action: 'moved',
      entityType: 'task',
      entityId: id,
      description: actionDesc,
      boardId: existingTask.list.boardId,
      taskId: id,
      metadata: {
        sourceListId,
        targetListId: listId,
        position,
      },
    });

    // Emit real-time update
    socketService.emitToBoard(existingTask.list.boardId, 'task:move', {
      task,
      sourceListId,
      targetListId: listId,
      position,
    });

    sendSuccess(res, task, 'Task moved successfully');
  } catch (error) {
    console.error('Move task error:', error);
    sendError(res, 'Failed to move task', 500);
  }
}

/**
 * Assign user to task
 */
export async function assignTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { assigneeId } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, existingTask.list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    // Check if assignee is a board member
    if (!(await isBoardMember(assigneeId, existingTask.list.boardId))) {
      sendError(res, 'Assignee must be a board member', 400);
      return;
    }

    // Check if already assigned
    const existingAssignment = await prisma.taskAssignee.findUnique({
      where: {
        userId_taskId: { userId: assigneeId, taskId: id },
      },
    });

    if (existingAssignment) {
      sendError(res, 'User is already assigned to this task', 409);
      return;
    }

    // Create assignment
    await prisma.taskAssignee.create({
      data: {
        userId: assigneeId,
        taskId: id,
      },
    });

    // Get updated task
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        list: {
          select: { id: true, name: true, boardId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Get assignee info for activity
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { name: true },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'assigned',
      entityType: 'task',
      entityId: id,
      description: `assigned ${assignee?.name} to task "${existingTask.title}"`,
      boardId: existingTask.list.boardId,
      taskId: id,
    });

    // Emit real-time update
    socketService.emitToBoard(existingTask.list.boardId, 'task:update', task);

    sendSuccess(res, task, 'User assigned to task');
  } catch (error) {
    console.error('Assign task error:', error);
    sendError(res, 'Failed to assign user', 500);
  }
}

/**
 * Unassign user from task
 */
export async function unassignTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id, assigneeId } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, existingTask.list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    await prisma.taskAssignee.delete({
      where: {
        userId_taskId: { userId: assigneeId, taskId: id },
      },
    });

    // Get updated task
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        list: {
          select: { id: true, name: true, boardId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Emit real-time update
    socketService.emitToBoard(existingTask.list.boardId, 'task:update', task);

    sendSuccess(res, task, 'User unassigned from task');
  } catch (error) {
    console.error('Unassign task error:', error);
    sendError(res, 'Failed to unassign user', 500);
  }
}

/**
 * Add comment to task
 */
export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Check membership
    if (!(await isBoardMember(userId, existingTask.list.boardId))) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        taskId: id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Log activity
    await activityService.createActivity(userId, {
      action: 'commented',
      entityType: 'task',
      entityId: id,
      description: `commented on task "${existingTask.title}"`,
      boardId: existingTask.list.boardId,
      taskId: id,
    });

    // Emit real-time update
    socketService.emitToBoard(existingTask.list.boardId, 'task:update', {
      taskId: id,
      comment,
    });

    sendSuccess(res, comment, 'Comment added', 201);
  } catch (error) {
    console.error('Add comment error:', error);
    sendError(res, 'Failed to add comment', 500);
  }
}

/**
 * Search tasks across boards
 */
export async function searchTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { query, priority, boardId, assigneeId } = req.query;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Get user's boards
    const memberships = await prisma.boardMember.findMany({
      where: { userId },
      select: { boardId: true },
    });

    const boardIds = memberships.map((m) => m.boardId);

    // Build where clause
    const where: any = {
      list: {
        boardId: boardId ? { equals: boardId as string } : { in: boardIds },
      },
      isArchived: false,
    };

    if (query && typeof query === 'string') {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }

    if (priority && typeof priority === 'string') {
      where.priority = priority;
    }

    if (assigneeId && typeof assigneeId === 'string') {
      where.assignees = {
        some: { userId: assigneeId },
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          list: {
            select: { id: true, name: true, boardId: true, board: { select: { name: true } } },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    sendSuccess(
      res,
      tasks,
      undefined,
      200,
      calculatePagination(page, limit, total)
    );
  } catch (error) {
    console.error('Search tasks error:', error);
    sendError(res, 'Failed to search tasks', 500);
  }
}
