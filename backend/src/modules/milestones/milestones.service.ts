import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(projectId: string, userId: string, dto: CreateMilestoneDto) {
    if (dto.startDate && dto.targetDate) {
      const start = new Date(dto.startDate);
      const target = new Date(dto.targetDate);
      if (start > target) {
        throw new BadRequestException('startDate cannot be after targetDate');
      }
    }

    const order =
      dto.order ??
      (
        await this.prisma.milestone.findFirst({
          where: { projectId },
          orderBy: { order: 'desc' },
        })
      )?.order ??
      0;

    const milestone = await this.prisma.milestone.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        projectId,
        order: dto.order ?? order + 1000,
      },
    });

    await this.activityService.createActivity({
      type: 'MILESTONE_CREATED',
      actorId: userId,
      projectId,
      entityType: 'PROJECT',
      metadata: { milestoneId: milestone.id, name: milestone.name },
    });

    return milestone;
  }

  async findAll(projectId: string) {
    const milestones = await this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { issues: true },
        },
      },
    });

    const issues = await this.prisma.issue.groupBy({
      by: ['milestoneId', 'status'],
      where: {
        projectId,
        milestoneId: { not: null },
      },
      _count: { id: true },
    });

    return milestones.map((milestone) => {
      const milestoneIssues = issues.filter(
        (i) => i.milestoneId === milestone.id,
      );
      const totalIssues = milestone._count.issues;
      const completedIssues = milestoneIssues
        .filter((i) => i.status === 'DONE')
        .reduce((sum, i) => sum + i._count.id, 0);

      const progress =
        totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;

      return {
        ...milestone,
        progress,
        totalIssues,
        completedIssues,
      };
    });
  }

  async findOne(projectId: string, id: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id, projectId },
      include: {
        issues: {
          select: {
            id: true,
            key: true,
            title: true,
            status: true,
            priority: true,
            type: true,
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const totalIssues = milestone.issues.length;
    const completedIssues = milestone.issues.filter(
      (i) => i.status === 'DONE',
    ).length;
    const progress =
      totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;

    return {
      ...milestone,
      totalIssues,
      completedIssues,
      progress,
    };
  }

  async update(projectId: string, userId: string, id: string, dto: UpdateMilestoneDto) {
    const milestone = await this.findOne(projectId, id);

    const startDate =
      dto.startDate !== undefined ? dto.startDate : milestone.startDate;
    const targetDate =
      dto.targetDate !== undefined ? dto.targetDate : milestone.targetDate;

    if (startDate && targetDate) {
      if (new Date(startDate) > new Date(targetDate)) {
        throw new BadRequestException('startDate cannot be after targetDate');
      }
    }

    const updated = await this.prisma.milestone.update({
      where: { id },
      data: dto,
    });

    await this.activityService.createActivity({
      type: 'MILESTONE_UPDATED',
      actorId: userId,
      projectId,
      entityType: 'PROJECT',
      metadata: { milestoneId: id, changes: dto },
    });

    return updated;
  }

  async delete(projectId: string, userId: string, id: string) {
    const milestone = await this.findOne(projectId, id);

    await this.prisma.issue.updateMany({
      where: { milestoneId: id },
      data: { milestoneId: null },
    });

    const deleted = await this.prisma.milestone.delete({
      where: { id },
    });

    await this.activityService.createActivity({
      type: 'MILESTONE_DELETED',
      actorId: userId,
      projectId,
      entityType: 'PROJECT',
      metadata: { milestoneId: id, name: milestone.name },
    });

    return deleted;
  }

  async assignIssues(projectId: string, id: string, issueIds: string[]) {
    await this.findOne(projectId, id);

    const updated = await this.prisma.issue.updateMany({
      where: {
        id: { in: issueIds },
        projectId,
      },
      data: { milestoneId: id },
    });

    return { updated: updated.count };
  }

  async reorder(projectId: string, milestoneIds: string[]) {
    const updates = milestoneIds.map((id, index) =>
      this.prisma.milestone.updateMany({
        where: { id, projectId },
        data: { order: index * 1000 },
      }),
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }
}
