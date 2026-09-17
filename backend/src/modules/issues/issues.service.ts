import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IssueStatus, IssuePriority, ProjectRole, Prisma } from '@prisma/client';
import { generateKeyBetween } from 'fractional-indexing';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueQueryDto } from './dto/issue-query.dto';
import { MoveIssueDto } from './dto/move-issue.dto';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  displayName: true,
  email: true,
  avatarUrl: true,
};

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveProjectId(projectParam: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectParam }, { key: projectParam }] },
      select: { id: true },
    });
    return project?.id || projectParam;
  }

  private async resolveIssueId(projectId: string, issueParam: string): Promise<string> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        OR: [{ id: issueParam }, { key: issueParam }],
        projectId,
      },
      select: { id: true },
    });
    return issue?.id || issueParam;
  }

  private async validateAssignee(projectParam: string, assigneeId: string) {
    const projectId = await this.resolveProjectId(projectParam);
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!member) {
      throw new BadRequestException('Assignee is not a project member');
    }
  }

  async create(
    projectParam: string,
    reporterId: string,
    dto: CreateIssueDto,
    userRole: ProjectRole,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    if (userRole !== ProjectRole.ADMIN && userRole !== ProjectRole.MEMBER) {
      throw new ForbiddenException('Insufficient permissions to modify issues');
    }

    if (dto.assigneeId) {
      await this.validateAssignee(projectId, dto.assigneeId);
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { issueSequence: { increment: 1 } },
        select: { key: true, issueSequence: true },
      });

      const issueKey = `${project.key}-${project.issueSequence}`;

      const status = dto.status || IssueStatus.TODO;

      const lastIssue = await tx.issue.findFirst({
        where: { projectId, status },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const order = generateKeyBetween(lastIssue?.order || null, null);

      const issue = await tx.issue.create({
        data: {
          projectId,
          key: issueKey,
          title: dto.title,
          description: dto.description || null,
          status,
          order,
          priority: dto.priority || IssuePriority.MEDIUM,
          reporterId,
          assigneeId: dto.assigneeId || null,
        },
        include: {
          reporter: { select: USER_SELECT },
          assignee: { select: USER_SELECT },
        },
      });

      await tx.issueActivity.create({
        data: {
          issueId: issue.id,
          actorId: reporterId,
          type: 'ISSUE_CREATED',
          metadata: { title: issue.title },
        },
      });

      return issue;
    });
  }

  async findAll(projectParam: string, query: IssueQueryDto) {
    const projectId = await this.resolveProjectId(projectParam);
    const where: Prisma.IssueWhereInput = { projectId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { key: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'key'];
    const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      this.prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          reporter: { select: USER_SELECT },
          assignee: { select: USER_SELECT },
        },
      }),
      this.prisma.issue.count({ where }),
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

  async findOne(projectParam: string, issueParam: string) {
    const projectId = await this.resolveProjectId(projectParam);
    const issueId = await this.resolveIssueId(projectId, issueParam);
    const issue = await this.prisma.issue.findFirst({
      where: { id: issueId, projectId },
      include: {
        reporter: { select: USER_SELECT },
        assignee: { select: USER_SELECT },
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  async getBoard(projectParam: string) {
    const projectId = await this.resolveProjectId(projectParam);
    const issues = await this.prisma.issue.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        reporter: { select: USER_SELECT },
        assignee: { select: USER_SELECT },
      },
    });

    type BoardIssue = (typeof issues)[number];

    const columns: Record<IssueStatus, BoardIssue[]> = {
      [IssueStatus.TODO]: [],
      [IssueStatus.IN_PROGRESS]: [],
      [IssueStatus.IN_PREVIEW]: [],
      [IssueStatus.DONE]: [],
    };

    for (const issue of issues) {
      if (columns[issue.status]) {
        columns[issue.status].push(issue);
      }
    }

    return columns;
  }

  async moveIssue(
    projectParam: string,
    issueParam: string,
    dto: MoveIssueDto,
    userRole: ProjectRole,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    const issueId = await this.resolveIssueId(projectId, issueParam);
    if (userRole !== ProjectRole.ADMIN && userRole !== ProjectRole.MEMBER) {
      throw new ForbiddenException('Insufficient permissions to move issues');
    }

    return this.prisma.$transaction(async (tx) => {
      // Lock the project to serialize concurrent moves within the same project
      await tx.$queryRaw`SELECT 1 FROM "Project" WHERE id = ${projectId} FOR UPDATE`;

      const issue = await tx.issue.findUnique({ where: { id: issueId } });
      if (!issue) {
        throw new NotFoundException('Issue not found');
      }
      if (issue.projectId !== projectId) {
        throw new ForbiddenException('Issue belongs to a different project');
      }

      let a: string | null = null;
      let b: string | null = null;

      if (dto.afterIssueId) {
        if (dto.afterIssueId === issueId) {
          throw new BadRequestException('Cannot move issue relative to itself');
        }
        const afterIssue = await tx.issue.findUnique({ where: { id: dto.afterIssueId } });
        if (!afterIssue) {
          throw new BadRequestException('afterIssueId not found');
        }
        if (afterIssue.projectId !== projectId || afterIssue.status !== dto.status) {
          throw new BadRequestException('afterIssueId invalid (wrong project or target status)');
        }
        a = afterIssue.order;
      }

      if (dto.beforeIssueId) {
        if (dto.beforeIssueId === issueId) {
          throw new BadRequestException('Cannot move issue relative to itself');
        }
        const beforeIssue = await tx.issue.findUnique({ where: { id: dto.beforeIssueId } });
        if (!beforeIssue) {
          throw new BadRequestException('beforeIssueId not found');
        }
        if (beforeIssue.projectId !== projectId || beforeIssue.status !== dto.status) {
          throw new BadRequestException('beforeIssueId invalid (wrong project or target status)');
        }
        b = beforeIssue.order;
      }

      if (!dto.afterIssueId && !dto.beforeIssueId) {
        const lastIssue = await tx.issue.findFirst({
          where: { projectId, status: dto.status },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        if (lastIssue) {
          a = lastIssue.order;
        }
      }

      let newOrder: string;
      try {
        if (a !== null && b !== null && a >= b) {
          throw new Error('a >= b');
        }
        newOrder = generateKeyBetween(a, b);
      } catch (_err) {
        throw new BadRequestException('Invalid neighbor combination for fractional indexing');
      }

      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          status: dto.status,
          order: newOrder,
        },
        include: {
          reporter: { select: USER_SELECT },
          assignee: { select: USER_SELECT },
        },
      });

      if (issue.status !== dto.status) {
        await tx.issueActivity.create({
          data: {
            issueId,
            type: 'STATUS_CHANGED',
            metadata: { from: issue.status, to: dto.status },
          }
        });
      }

      return updatedIssue;
    });
  }

  async update(
    projectParam: string,
    issueParam: string,
    dto: UpdateIssueDto,
    userRole: ProjectRole,
  ) {
    if (userRole !== ProjectRole.ADMIN && userRole !== ProjectRole.MEMBER) {
      throw new ForbiddenException('Insufficient permissions to modify issues');
    }

    const oldIssue = await this.findOne(projectParam, issueParam);
    const projectId = oldIssue.projectId;
    const issueId = oldIssue.id;

    if (dto.assigneeId && dto.assigneeId !== oldIssue.assigneeId) {
      await this.validateAssignee(projectId, dto.assigneeId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          assigneeId: dto.assigneeId,
        },
        include: {
          reporter: { select: USER_SELECT },
          assignee: { select: USER_SELECT },
        },
      });

      if (dto.title !== undefined && dto.title !== oldIssue.title) {
        await tx.issueActivity.create({
          data: {
            issueId,
            type: 'TITLE_CHANGED',
            metadata: { from: oldIssue.title, to: dto.title },
          }
        });
      }

      if (dto.description !== undefined && dto.description !== oldIssue.description) {
        await tx.issueActivity.create({
          data: {
            issueId,
            type: 'DESCRIPTION_CHANGED',
            metadata: { updated: true },
          }
        });
      }

      if (dto.status !== undefined && dto.status !== oldIssue.status) {
        await tx.issueActivity.create({
          data: {
            issueId,
            type: 'STATUS_CHANGED',
            metadata: { from: oldIssue.status, to: dto.status },
          }
        });
      }

      if (dto.priority !== undefined && dto.priority !== oldIssue.priority) {
        await tx.issueActivity.create({
          data: {
            issueId,
            type: 'PRIORITY_CHANGED',
            metadata: { from: oldIssue.priority, to: dto.priority },
          }
        });
      }

      if (dto.assigneeId !== undefined && dto.assigneeId !== oldIssue.assigneeId) {
        const fromUserId = oldIssue.assigneeId;
        const fromName = oldIssue.assignee 
          ? (oldIssue.assignee.displayName || [oldIssue.assignee.firstName, oldIssue.assignee.lastName].filter(Boolean).join(' ') || oldIssue.assignee.email) 
          : null;
        
        let toName = null;
        if (dto.assigneeId) {
          const toUser = await tx.user.findUnique({ where: { id: dto.assigneeId } });
          toName = toUser 
            ? (toUser.displayName || [toUser.firstName, toUser.lastName].filter(Boolean).join(' ') || toUser.email) 
            : null;
        }

        await tx.issueActivity.create({
          data: {
            issueId,
            type: 'ASSIGNEE_CHANGED',
            metadata: { 
              fromUserId, 
              fromName, 
              toUserId: dto.assigneeId, 
              toName 
            },
          }
        });
      }

      return updatedIssue;
    });
  }

  async delete(projectParam: string, issueParam: string, userRole: ProjectRole) {
    if (userRole !== ProjectRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions to delete issues');
    }

    const issue = await this.findOne(projectParam, issueParam);

    return this.prisma.issue.delete({
      where: { id: issue.id },
    });
  }
}
