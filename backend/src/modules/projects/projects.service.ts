import { ActivityService } from '../activity/activity.service';
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private workflowsService: WorkflowsService,
    private activityService: ActivityService,
  ) {}

  async create(orgParam: string, userId: string, dto: CreateProjectDto) {
    const org = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgParam }, { slug: orgParam }] },
    });
    if (!org) throw new NotFoundException('Organization not found');
    const orgId = org.id;

    const existing = await this.prisma.project.findFirst({
      where: { organizationId: orgId, key: dto.key },
    });
    if (existing) throw new ConflictException('Project key must be unique');

    const project = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          name: dto.name,
          key: dto.key,
          description: dto.description,
          organizationId: orgId,
          createdById: userId,
        },
      });
      await tx.projectMember.create({
        data: { projectId: p.id, userId, role: 'ADMIN' },
      });

      await this.workflowsService.createDefaultWorkflow(p.id, tx);

      return p;
    });

    // ponytail: fire-and-forget, failure logged
    this.activityService
      .createActivity({
        type: 'PROJECT_CREATED',
        actorId: userId,
        organizationId: project.organizationId,
        projectId: project.id,
        entityType: 'PROJECT',
        metadata: { projectName: project.name, projectKey: project.key },
      })
      .catch((err) => console.error('Activity logging failed', err));

    return project;
  }

  async findAll(orgParam: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgParam }, { slug: orgParam }] },
    });
    if (!org) return [];
    return this.prisma.project.findMany({
      where: { organizationId: org.id, members: { some: { userId } } },
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { key: { equals: projectId, mode: 'insensitive' } },
        ],
        members: { some: { userId } },
      },
      include: { members: true },
    });
    if (!project) throw new NotFoundException();
    return project;
  }

  async getProjectSummary(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { key: { equals: projectId, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    const resolvedProjectId = project.id;
    const now = new Date();

    const [
      totalIssues,
      completedIssues,
      inProgressIssues,
      overdueIssues,
      statusBreakdownGrouped,
      currentMilestone,
      recentActivities,
      recentlyUpdatedIssues,
    ] = await Promise.all([
      this.prisma.issue.count({ where: { projectId: resolvedProjectId } }),
      this.prisma.issue.count({
        where: { projectId: resolvedProjectId, status: 'DONE' },
      }),
      this.prisma.issue.count({
        where: { projectId: resolvedProjectId, status: 'IN_PROGRESS' },
      }),
      this.prisma.issue.count({
        where: {
          projectId: resolvedProjectId,
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
      }),
      this.prisma.issue.groupBy({
        by: ['workflowStatusId'],
        where: { projectId: resolvedProjectId },
        _count: { id: true },
      }),
      this.prisma.milestone.findFirst({
        where: { projectId: resolvedProjectId, status: 'IN_PROGRESS' },
        include: { _count: { select: { issues: true } } },
        orderBy: { targetDate: 'asc' },
      }),
      this.prisma.activity.findMany({
        where: { projectId: resolvedProjectId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.issue.findMany({
        where: { projectId: resolvedProjectId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          workflowStatus: { select: { id: true, name: true, color: true } },
        },
      }),
    ]);

    const progressPercentage =
      totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
    const workflowStatusIds = statusBreakdownGrouped
      .map((g) => g.workflowStatusId)
      .filter(Boolean) as string[];
    const workflowStatuses = await this.prisma.workflowStatus.findMany({
      where: { id: { in: workflowStatusIds } },
    });

    const statusBreakdown = statusBreakdownGrouped.map((g) => {
      const status = workflowStatuses.find((s) => s.id === g.workflowStatusId);
      return {
        id: g.workflowStatusId,
        name: status?.name || 'Unknown',
        count: g._count.id,
        color: status?.color,
      };
    });

    return {
      metrics: {
        totalIssues,
        completedIssues,
        inProgressIssues,
        overdueIssues,
        progressPercentage,
      },
      currentMilestone,
      statusBreakdown,
      recentActivities,
      recentlyUpdatedIssues,
    };
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    const targetProject = await this.findOne(projectId, userId);
    if (
      targetProject.members.find((member) => member.userId === userId)?.role !==
      'ADMIN'
    ) {
      throw new ForbiddenException('Only ADMIN users can update projects');
    }
    return this.prisma.project.update({
      where: { id: targetProject.id },
      data: dto,
    });
  }

  async delete(projectId: string, userId: string) {
    const targetProject = await this.findOne(projectId, userId);
    if (
      targetProject.members.find((member) => member.userId === userId)?.role !==
      'ADMIN'
    ) {
      throw new ForbiddenException('Only ADMIN users can delete projects');
    }
    return this.prisma.project.delete({ where: { id: targetProject.id } });
  }
}
