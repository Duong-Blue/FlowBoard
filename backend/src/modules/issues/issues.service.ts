import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IssueStatus, IssuePriority, IssueType, ProjectRole, Prisma } from '@prisma/client';
import { generateKeyBetween } from 'fractional-indexing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
  ) {}

  private computeDeadlineState(status: IssueStatus, dueDate: Date | null, completedAt: Date | null): 'NO_DUE_DATE' | 'COMPLETED' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' {
    if (!dueDate) return 'NO_DUE_DATE';
    if (status === IssueStatus.DONE) return 'COMPLETED';
    
    const now = new Date();
    if (now >= dueDate) return 'OVERDUE';
    
    const diffMs = dueDate.getTime() - now.getTime();
    if (diffMs <= 48 * 3600 * 1000) return 'DUE_SOON';
    
    return 'UPCOMING';
  }

  private mapIssueWithDeadlineState<T extends { status: IssueStatus; dueDate?: Date | null; completedAt?: Date | null }>(issue: T) {
    if (!issue) return issue;
    return {
      ...issue,
      deadlineState: this.computeDeadlineState(issue.status, issue.dueDate || null, issue.completedAt || null),
    };
  }

  private async resolveProjectId(projectParam: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectParam }, { key: { equals: projectParam, mode: 'insensitive' } }] },
      select: { id: true },
    });
    return project?.id || projectParam;
  }

  private async resolveIssueId(projectId: string, issueParam: string): Promise<string> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        OR: [{ id: issueParam }, { key: { equals: issueParam, mode: 'insensitive' } }],
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

  private async validateStatusTransition(
    currentStatus: IssueStatus,
    targetStatus: IssueStatus,
    userRole: ProjectRole,
    hasActiveBlockers: boolean,
    isSubtask: boolean = false,
  ): Promise<void> {
    if (currentStatus === targetStatus) return;

    const allowed: Record<IssueStatus, IssueStatus[]> = {
      [IssueStatus.TODO]: isSubtask ? [IssueStatus.IN_PROGRESS, IssueStatus.DONE] : [IssueStatus.IN_PROGRESS],
      [IssueStatus.IN_PROGRESS]: [IssueStatus.TODO, IssueStatus.IN_PREVIEW, IssueStatus.DONE],
      [IssueStatus.IN_PREVIEW]: [IssueStatus.IN_PROGRESS, IssueStatus.DONE],
      [IssueStatus.DONE]: isSubtask ? [IssueStatus.TODO, IssueStatus.IN_PROGRESS] : [IssueStatus.IN_PROGRESS],
    };

    if (!allowed[currentStatus].includes(targetStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    }

    if (targetStatus === IssueStatus.DONE) {
      if (currentStatus === IssueStatus.IN_PROGRESS && userRole !== ProjectRole.ADMIN && !isSubtask) {
        throw new BadRequestException('Direct transition from IN_PROGRESS to DONE requires ADMIN role');
      }

      if (hasActiveBlockers) {
        throw new BadRequestException('Cannot move issue to DONE while it is blocked by unresolved issues');
      }
    }
  }

  private async checkHasActiveBlockers(issueId: string): Promise<boolean> {
    const blockers = await this.prisma.issueRelation.findMany({
      where: {
        OR: [
          { targetIssueId: issueId, type: 'BLOCKS', sourceIssue: { status: { not: IssueStatus.DONE } } },
          { sourceIssueId: issueId, type: 'IS_BLOCKED_BY', targetIssue: { status: { not: IssueStatus.DONE } } }
        ]
      }
    });
    return blockers.length > 0;
  }

  private async handleParentAutoComplete(tx: Prisma.TransactionClient, issueId: string, parentId: string, actorId: string) {
    const siblings = await tx.issue.findMany({
      where: { parentId, id: { not: issueId } },
      select: { status: true }
    });

    const allDone = siblings.every(s => s.status === IssueStatus.DONE);
    if (allDone) {
      const parent = await tx.issue.findUnique({
        where: { id: parentId },
        select: { id: true, status: true }
      });

      if (parent && parent.status !== IssueStatus.DONE) {
        await tx.issue.update({
          where: { id: parent.id },
          data: { status: IssueStatus.DONE, completedAt: new Date() }
        });

        await tx.issueActivity.create({
          data: {
            issueId: parent.id,
            actorId,
            type: 'STATUS_CHANGED',
            metadata: { from: parent.status, to: IssueStatus.DONE, autoCompleted: true }
          }
        });
      }
    }
  }

  async create(
    projectParam: string,
    reporterId: string,
    dto: CreateIssueDto,
    userRole: ProjectRole,
    correlationId?: string,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    if (userRole !== ProjectRole.ADMIN && userRole !== ProjectRole.MEMBER) {
      throw new ForbiddenException('Insufficient permissions to modify issues');
    }

    if (dto.assigneeId) {
      await this.validateAssignee(projectId, dto.assigneeId);
    }

    const createdIssue = await this.prisma.$transaction(async (tx) => {
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
          type: dto.type || IssueType.TASK,
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

    try {
      this.eventEmitter.emit('issue.created', { projectId, issue: createdIssue, correlationId });

      if (createdIssue.assigneeId && createdIssue.assigneeId !== reporterId) {
        const notif = await this.notificationsService.createNotification({
          userId: createdIssue.assigneeId,
          type: 'ISSUE_ASSIGNED',
          title: 'You have been assigned to an issue',
          message: `${createdIssue.reporter.displayName || createdIssue.reporter.firstName} assigned you to ${createdIssue.key}`,
          metadata: { projectId, issueId: createdIssue.id, key: createdIssue.key },
          projectId,
          issueId: createdIssue.id,
          actorId: reporterId,
        });
        this.eventEmitter.emit('notification.new', { userId: createdIssue.assigneeId, notification: notif });
      }
    } catch (err) {
      console.error('Failed to emit events for issue creation', err);
    }

    return this.mapIssueWithDeadlineState(createdIssue);
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

    if (query.noDueDate) {
      where.dueDate = null;
    } else if (query.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { not: IssueStatus.DONE };
    } else if (query.dueSoon) {
      where.dueDate = {
        gte: new Date(),
        lte: new Date(Date.now() + 48 * 3600 * 1000),
      };
      where.status = { not: IssueStatus.DONE };
    } else if (query.dueDateFrom || query.dueDateTo) {
      where.dueDate = {};
      if (query.dueDateFrom) where.dueDate.gte = new Date(query.dueDateFrom);
      if (query.dueDateTo) where.dueDate.lte = new Date(query.dueDateTo);
    }

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'key', 'dueDate'];
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
      items: items.map(issue => this.mapIssueWithDeadlineState(issue)),
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

    return this.mapIssueWithDeadlineState(issue);
  }

  async getBoard(projectParam: string) {
    const projectId = await this.resolveProjectId(projectParam);
    const issues = await this.prisma.issue.findMany({
      where: { projectId, parentId: null },
      // Circuit breaker: limit board fetch to 2000 items to prevent Node/DB OOM
      take: 2000,
      orderBy: { order: 'asc' },
      include: {
        reporter: { select: USER_SELECT },
        assignee: { select: USER_SELECT },
      },
    });

    type BoardIssue = (typeof issues)[number];

    const columns: Record<IssueStatus, any[]> = {
      [IssueStatus.TODO]: [],
      [IssueStatus.IN_PROGRESS]: [],
      [IssueStatus.IN_PREVIEW]: [],
      [IssueStatus.DONE]: [],
    };

    for (const issue of issues) {
      if (columns[issue.status]) {
        columns[issue.status].push(this.mapIssueWithDeadlineState(issue));
      }
    }

    return columns;
  }

  async moveIssue(
    projectParam: string,
    issueParam: string,
    actorId: string,
    dto: MoveIssueDto,
    userRole: ProjectRole,
    correlationId?: string,
  ) {
    const projectId = await this.resolveProjectId(projectParam);
    const issueId = await this.resolveIssueId(projectId, issueParam);
    if (userRole !== ProjectRole.ADMIN && userRole !== ProjectRole.MEMBER) {
      throw new ForbiddenException('Insufficient permissions to move issues');
    }

    const movedIssue = await this.prisma.$transaction(async (tx) => {
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

      let completedAt: Date | null | undefined = undefined;
      if (issue.status !== dto.status) {
        if (dto.status === IssueStatus.DONE) {
          completedAt = new Date();
        } else if (issue.status === IssueStatus.DONE) {
          completedAt = null;
        }
      }

      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          status: dto.status,
          order: newOrder,
          completedAt,
        },
        include: {
          reporter: { select: USER_SELECT },
          assignee: { select: USER_SELECT },
        },
      });

      if (issue.status !== dto.status) {
        const hasBlockers = await this.checkHasActiveBlockers(issueId);
        const isSubtask = issue.parentId !== null;
        await this.validateStatusTransition(issue.status, dto.status, userRole, hasBlockers, isSubtask);

        await tx.issueActivity.create({
          data: {
            issueId,
            actorId,
            type: 'STATUS_CHANGED',
            metadata: { from: issue.status, to: dto.status },
          }
        });

        if (dto.status === IssueStatus.DONE && issue.parentId) {
          await this.handleParentAutoComplete(tx, issueId, issue.parentId, actorId);
        }
      }

      return updatedIssue;
    });

    try {
      this.eventEmitter.emit('issue.moved', { projectId, issue: movedIssue, correlationId });
    } catch (err) {
      console.error('Failed to emit events for issue movement', err);
    }

    return this.mapIssueWithDeadlineState(movedIssue);
  }

  async update(
    projectParam: string,
    issueParam: string,
    actorId: string,
    dto: UpdateIssueDto,
    userRole: ProjectRole,
    correlationId?: string,
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

    const updatedIssue = await this.prisma.$transaction(async (tx) => {
      let completedAt: Date | null | undefined = undefined;
      if (dto.status !== undefined && dto.status !== oldIssue.status) {
        if (dto.status === IssueStatus.DONE) {
          completedAt = new Date();
        } else if (oldIssue.status === IssueStatus.DONE) {
          completedAt = null;
        }
      }

      const dbUpdatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          type: dto.type,
          priority: dto.priority,
          assigneeId: dto.assigneeId,
          parentId: dto.parentId,
          startDate: dto.startDate ? new Date(dto.startDate) : dto.startDate === null ? null : undefined,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : dto.dueDate === null ? null : undefined,
          completedAt,
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
            actorId,
            type: 'TITLE_CHANGED',
            metadata: { from: oldIssue.title, to: dto.title },
          }
        });
      }

      if (dto.description !== undefined && dto.description !== oldIssue.description) {
        await tx.issueActivity.create({
          data: {
            issueId,
            actorId,
            type: 'DESCRIPTION_CHANGED',
            metadata: { updated: true },
          }
        });
      }

      if (dto.status !== undefined && dto.status !== oldIssue.status) {
        const hasBlockers = await this.checkHasActiveBlockers(issueId);
        const isSubtask = oldIssue.parentId !== null;
        await this.validateStatusTransition(oldIssue.status, dto.status, userRole, hasBlockers, isSubtask);

        await tx.issueActivity.create({
          data: {
            issueId,
            actorId,
            type: 'STATUS_CHANGED',
            metadata: { from: oldIssue.status, to: dto.status },
          }
        });

        if (dto.status === IssueStatus.DONE) {
          await tx.issueActivity.create({
            data: { issueId, actorId, type: 'ISSUE_COMPLETED', metadata: {} }
          });
        } else if (oldIssue.status === IssueStatus.DONE) {
          await tx.issueActivity.create({
            data: { issueId, actorId, type: 'ISSUE_REOPENED', metadata: {} }
          });
        }

        if (dto.status === IssueStatus.DONE && oldIssue.parentId) {
          await this.handleParentAutoComplete(tx, issueId, oldIssue.parentId, actorId);
        }
      }

      if (dto.type !== undefined && dto.type !== oldIssue.type) {
        await tx.issueActivity.create({
          data: {
            issueId,
            actorId,
            type: 'TYPE_CHANGED',
            metadata: { from: oldIssue.type, to: dto.type },
          }
        });
      }

      if (dto.parentId !== undefined && dto.parentId !== oldIssue.parentId) {
        await tx.issueActivity.create({
          data: {
            issueId,
            actorId,
            type: 'SUBTASK_PARENT_CHANGED',
            metadata: { from: oldIssue.parentId, to: dto.parentId },
          }
        });
      }

      if (dto.priority !== undefined && dto.priority !== oldIssue.priority) {
        await tx.issueActivity.create({
          data: {
            issueId,
            actorId,
            type: 'PRIORITY_CHANGED',
            metadata: { from: oldIssue.priority, to: dto.priority },
          }
        });
      }

      if (dto.startDate !== undefined) {
        const oldTime = oldIssue.startDate?.getTime();
        const newTime = dto.startDate ? new Date(dto.startDate).getTime() : null;
        if (oldTime !== newTime) {
          if (!oldTime && newTime) {
            await tx.issueActivity.create({
              data: { issueId, actorId, type: 'START_DATE_SET', metadata: { to: dto.startDate } }
            });
          } else if (oldTime && !newTime) {
            await tx.issueActivity.create({
              data: { issueId, actorId, type: 'START_DATE_REMOVED', metadata: { from: oldIssue.startDate } }
            });
          } else {
            await tx.issueActivity.create({
              data: { issueId, actorId, type: 'START_DATE_CHANGED', metadata: { from: oldIssue.startDate, to: dto.startDate } }
            });
          }
        }
      }

      if (dto.dueDate !== undefined) {
        const oldTime = oldIssue.dueDate?.getTime();
        const newTime = dto.dueDate ? new Date(dto.dueDate).getTime() : null;
        if (oldTime !== newTime) {
          if (!oldTime && newTime) {
            await tx.issueActivity.create({
              data: { issueId, actorId, type: 'DUE_DATE_SET', metadata: { to: dto.dueDate } }
            });
          } else if (oldTime && !newTime) {
            await tx.issueActivity.create({
              data: { issueId, actorId, type: 'DUE_DATE_REMOVED', metadata: { from: oldIssue.dueDate } }
            });
          } else {
            await tx.issueActivity.create({
              data: { issueId, actorId, type: 'DUE_DATE_CHANGED', metadata: { from: oldIssue.dueDate, to: dto.dueDate } }
            });
          }
        }
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
            actorId,
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

      return dbUpdatedIssue;
    });

    try {
      this.eventEmitter.emit('issue.updated', { projectId, issue: updatedIssue, correlationId });

      if (dto.assigneeId && dto.assigneeId !== oldIssue.assigneeId && dto.assigneeId !== actorId) {
        const notif = await this.notificationsService.createNotification({
          userId: dto.assigneeId,
          type: 'ISSUE_ASSIGNED',
          title: 'You have been assigned to an issue',
          message: `${updatedIssue.reporter?.displayName || updatedIssue.reporter?.firstName || 'Someone'} assigned you to ${updatedIssue.key}`,
          metadata: { projectId, issueId: updatedIssue.id, key: updatedIssue.key },
          projectId,
          issueId: updatedIssue.id,
          actorId,
        });
        this.eventEmitter.emit('notification.new', { userId: dto.assigneeId, notification: notif });
      }
    } catch (err) {
      console.error('Failed to emit events for issue update', err);
    }

    return this.mapIssueWithDeadlineState(updatedIssue);
  }

  async delete(
    projectParam: string,
    issueParam: string,
    actorId: string,
    userRole: ProjectRole,
    force: boolean = false,
    correlationId?: string,
  ) {
    if (userRole !== ProjectRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions to delete issues');
    }

    const issue = await this.findOne(projectParam, issueParam);
    const projectId = issue.projectId;

    const subtaskCount = await this.prisma.issue.count({ where: { parentId: issue.id } });
    if (subtaskCount > 0 && !force) {
      throw new ConflictException({
        message: 'Issue has subtasks and requires confirmation to delete',
        requiresConfirmation: true,
        subtaskCount,
      });
    }

    await this.prisma.issue.delete({
      where: { id: issue.id },
    });

    try {
      this.eventEmitter.emit('issue.deleted', { projectId, issueId: issue.id, correlationId });
    } catch (err) {
      console.error('Failed to emit events for issue deletion', err);
    }

    return { success: true };
  }
}
