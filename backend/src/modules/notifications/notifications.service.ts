import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string, query: GetNotificationsQueryDto) {
    const { page = 1, limit = 20, unreadOnly } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly !== undefined ? { isRead: false } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true },
          },
          project: {
            select: { id: true, name: true, key: true },
          },
          issue: {
            select: { id: true, title: true, key: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { count: result.count };
  }

  async createNotification(data: {
    userId: string;
    actorId?: string;
    organizationId?: string;
    projectId?: string;
    issueId?: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        organizationId: data.organizationId,
        projectId: data.projectId,
        issueId: data.issueId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? Prisma.JsonNull,
      },
    });
  }
}
