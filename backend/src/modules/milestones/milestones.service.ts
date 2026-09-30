import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, dto: CreateMilestoneDto) {
    const order =
      dto.order ??
      (
        await this.prisma.milestone.findFirst({
          where: { projectId },
          orderBy: { order: 'desc' },
        })
      )?.order ??
      0;

    return this.prisma.milestone.create({
      data: {
        ...dto,
        projectId,
        order: dto.order ?? order + 1000,
      },
    });
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
      const milestoneIssues = issues.filter((i) => i.milestoneId === milestone.id);
      const totalIssues = milestone._count.issues;
      const completedIssues = milestoneIssues
        .filter((i) => i.status === 'DONE')
        .reduce((sum, i) => sum + i._count.id, 0);

      const progress = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;

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
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return milestone;
  }

  async update(projectId: string, id: string, dto: UpdateMilestoneDto) {
    await this.findOne(projectId, id);

    return this.prisma.milestone.update({
      where: { id },
      data: dto,
    });
  }

  async delete(projectId: string, id: string) {
    await this.findOne(projectId, id);

    await this.prisma.issue.updateMany({
      where: { milestoneId: id },
      data: { milestoneId: null },
    });

    return this.prisma.milestone.delete({
      where: { id },
    });
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
