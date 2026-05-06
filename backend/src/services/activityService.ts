import { PrismaClient } from '@prisma/client';
import { CreateActivityInput } from '../types';
import { socketService } from './socketService';

const prisma = new PrismaClient();

class ActivityService {
  /**
   * Create an activity log entry
   */
  async createActivity(
    userId: string,
    input: CreateActivityInput
  ): Promise<void> {
    try {
      const activity = await prisma.activity.create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          description: input.description,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          userId,
          boardId: input.boardId,
          taskId: input.taskId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      // Emit real-time activity update to board
      if (input.boardId) {
        socketService.emitToBoard(input.boardId, 'activity:new', activity);
      }
    } catch (error) {
      console.error('Failed to create activity:', error);
      // Don't throw - activity logging shouldn't break main operations
    }
  }

  /**
   * Get activities for a board with pagination
   */
  async getBoardActivities(
    boardId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { boardId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: { boardId } }),
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get activities for a task
   */
  async getTaskActivities(taskId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { taskId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: { taskId } }),
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get user's activity feed
   */
  async getUserActivityFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    // Get boards user is a member of
    const memberships = await prisma.boardMember.findMany({
      where: { userId },
      select: { boardId: true },
    });

    const boardIds = memberships.map((m) => m.boardId);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { boardId: { in: boardIds } },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          board: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: { boardId: { in: boardIds } } }),
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}

export const activityService = new ActivityService();
