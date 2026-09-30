import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
  ) {}

  private async checkAdminPermission(orgId: string, projectId: string, userId: string) {
    const orgMember = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (orgMember && (orgMember.role === 'OWNER' || orgMember.role === 'ADMIN')) {
      return;
    }

    const projMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (projMember && projMember.role === 'ADMIN') {
      return;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private async resolveProjectId(projectParam: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectParam },
          { key: { equals: projectParam, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    return project?.id || projectParam;
  }

  async add(
    projectParam: string,
    dto: { userId: string; role: ProjectRole },
    requesterId: string,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    await this.checkAdminPermission(project.organizationId, project.id, requesterId);

    const orgMember = await this.prisma.organizationMember.findFirst({
      where: { organizationId: project.organizationId, userId: dto.userId },
    });

    if (!orgMember) {
      throw new BadRequestException('User must be an organization member');
    }

    const createdMember = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },
    });

    await this.activityService.createActivity({
      type: 'PROJECT_MEMBER_ADDED',
      actorId: requesterId,
      projectId,
      entityType: 'PROJECT',
      metadata: { memberId: dto.userId, role: dto.role },
    });

    try {
      const notif = await this.notificationsService.createNotification({
        userId: dto.userId,
        type: 'PROJECT_MEMBER_ADDED',
        title: 'You were added to a project',
        message: `You have been added to project ${project.name}`,
        metadata: { projectId, role: dto.role, projectName: project.name },
        projectId,
        actorId: requesterId,
      });
      this.eventEmitter.emit('notification.new', {
        userId: dto.userId,
        notification: notif,
      });
    } catch (err) {
      console.error('Failed to emit events for project member add', err);
    }

    return createdMember;
  }

  async findAll(projectParam: string, _requesterId: string) {
    const projectId = await this.resolveProjectId(projectParam);
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true },
    });
  }

  async updateRole(
    projectParam: string,
    targetUserId: string,
    requesterId: string,
    role: ProjectRole,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    await this.checkAdminPermission(project.organizationId, project.id, requesterId);

    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: { role },
    });
  }

  async remove(
    projectParam: string,
    targetUserId: string,
    requesterId: string,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    await this.checkAdminPermission(project.organizationId, project.id, requesterId);

    const deletedMember = await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    await this.activityService.createActivity({
      type: 'PROJECT_MEMBER_REMOVED',
      actorId: requesterId,
      projectId,
      entityType: 'PROJECT',
      metadata: { memberId: targetUserId, role: deletedMember.role },
    });

    try {
      this.eventEmitter.emit('project.member.removed', {
        projectId,
        userId: targetUserId,
      });
    } catch (err) {
      console.error('Failed to emit events for project member remove', err);
    }

    return deletedMember;
  }
}
