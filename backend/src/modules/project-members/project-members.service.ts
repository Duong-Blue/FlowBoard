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

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async checkOrgAdminPermission(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Insufficient permissions');
    }
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

    await this.checkOrgAdminPermission(project.organizationId, requesterId);

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

    await this.checkOrgAdminPermission(project.organizationId, requesterId);

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

    await this.checkOrgAdminPermission(project.organizationId, requesterId);

    const deletedMember = await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
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
