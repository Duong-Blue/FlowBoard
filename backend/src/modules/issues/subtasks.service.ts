import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IssueStatus, IssuePriority } from '@prisma/client';
import { generateKeyBetween } from 'fractional-indexing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateSubtaskDto } from './dto/create-subtask.dto';

@Injectable()
export class SubtasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    projectId: string,
    issueId: string,
    actorId: string,
    dto: CreateSubtaskDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const parent = await tx.issue.findUnique({
        where: { id: issueId },
        select: { id: true, parentId: true, projectId: true, key: true },
      });

      if (!parent || parent.projectId !== projectId) {
        throw new NotFoundException('Parent issue not found');
      }

      if (parent.parentId !== null) {
        throw new BadRequestException('Subtasks cannot have nested subtasks (max depth 1)');
      }

      const status = dto.status || IssueStatus.TODO;

      const lastIssue = await tx.issue.findFirst({
        where: { projectId, parentId: issueId, status },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const order = generateKeyBetween(lastIssue?.order || null, null);

      const subtask = await tx.issue.create({
        data: {
          projectId,
          parentId: issueId,
          key: null,
          title: dto.title,
          description: dto.description || null,
          status,
          order,
          priority: dto.priority || IssuePriority.MEDIUM,
          reporterId: actorId,
          assigneeId: dto.assigneeId || null,
        },
      });

      await tx.issueActivity.create({
        data: {
          issueId: issueId,
          actorId: actorId,
          type: 'SUBTASK_CREATED',
          metadata: { subtaskKey: subtask.key, title: subtask.title },
        },
      });

      return subtask;
    });
  }

  async findAll(projectId: string, issueId: string) {
    const parent = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { projectId: true },
    });

    if (!parent || parent.projectId !== projectId) {
      throw new NotFoundException('Parent issue not found');
    }

    const subtasks = await this.prisma.issue.findMany({
      where: { parentId: issueId },
      orderBy: { order: 'asc' },
    });

    const total = subtasks.length;
    const completed = subtasks.filter((s) => s.status === IssueStatus.DONE).length;

    return {
      items: subtasks,
      metrics: { total, completed },
    };
  }
}
