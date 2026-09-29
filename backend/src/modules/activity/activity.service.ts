import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueryActivityDto } from './dto/query-activity.dto';
import { ActivityType, ActivityScope } from '@prisma/client';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  displayName: true,
  email: true,
  avatarUrl: true,
};

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async createActivity(
    paramsOrIssueId:
      | string
      | {
          type: ActivityType;
          actorId: string | null;
          metadata?: Record<string, any>;
          issueId?: string;
          projectId?: string;
          organizationId?: string;
          entityType?: ActivityScope;
        },
    actorId?: string | null,
    type?: ActivityType,
    metadata: Record<string, any> = {},
  ) {
    if (typeof paramsOrIssueId === 'object') {
      return this.prisma.activity.create({
        data: {
          type: paramsOrIssueId.type,
          actorId: paramsOrIssueId.actorId,
          metadata: paramsOrIssueId.metadata ?? {},
          issueId: paramsOrIssueId.issueId,
          projectId: paramsOrIssueId.projectId,
          organizationId: paramsOrIssueId.organizationId,
          entityType: paramsOrIssueId.entityType ?? 'ISSUE',
        },
      });
    }

    return this.prisma.activity.create({
      data: {
        issueId: paramsOrIssueId,
        actorId: actorId ?? null,
        type: type!,
        metadata,
        entityType: 'ISSUE',
      },
    });
  }

  async findProjectActivities(projectId: string, queryDto: QueryActivityDto) {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: { projectId, entityType: 'PROJECT' },
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { actor: { select: USER_SELECT } },
      }),
      this.prisma.activity.count({
        where: { projectId, entityType: 'PROJECT' },
      }),
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

  private async resolveOrgId(orgIdOrSlug: string): Promise<string> {
    if (!this.prisma.organization?.findFirst) {
      return orgIdOrSlug;
    }
    const org = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgIdOrSlug }, { slug: orgIdOrSlug }] },
      select: { id: true },
    });
    return org?.id || orgIdOrSlug;
  }

  async findOrgActivities(orgIdOrSlug: string, queryDto: QueryActivityDto) {
    const orgId = await this.resolveOrgId(orgIdOrSlug);
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: { organizationId: orgId, entityType: 'ORGANIZATION' },
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { actor: { select: USER_SELECT } },
      }),
      this.prisma.activity.count({
        where: { organizationId: orgId, entityType: 'ORGANIZATION' },
      }),
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

  private async resolveIssueId(
    projectId: string,
    issueParam: string,
  ): Promise<string> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        OR: [
          { id: issueParam },
          { key: { equals: issueParam, mode: 'insensitive' } },
        ],
        projectId,
      },
      select: { id: true },
    });
    return issue?.id || issueParam;
  }

  async findAll(
    projectParam: string,
    issueParam: string,
    queryDto: QueryActivityDto,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    const issueId = await this.resolveIssueId(projectId, issueParam);

    const issue = await this.prisma.issue.findFirst({
      where: { id: issueId, projectId },
    });

    if (!issue) {
      throw new NotFoundException(
        'Issue not found or does not belong to this project',
      );
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: { issueId },
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { actor: { select: USER_SELECT } },
      }),
      this.prisma.activity.count({ where: { issueId } }),
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
}
