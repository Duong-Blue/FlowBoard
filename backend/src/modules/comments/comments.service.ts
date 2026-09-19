import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  displayName: true,
  email: true,
  avatarUrl: true,
};

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveProjectId(projectParam: string): Promise<string> {
    const project = await this.prisma.project?.findFirst({
      where: { OR: [{ id: projectParam }, { key: { equals: projectParam, mode: 'insensitive' } }] },
      select: { id: true },
    });
    return project?.id || projectParam;
  }

  private async resolveIssueId(projectId: string, issueParam: string): Promise<string> {
    const issue = await this.prisma.issue?.findFirst({
      where: {
        OR: [{ id: issueParam }, { key: { equals: issueParam, mode: 'insensitive' } }],
        projectId,
      },
      select: { id: true },
    });
    return issue?.id || issueParam;
  }

  private async verifyIssueInProject(projectParam: string, issueParam: string) {
    const projectId = await this.resolveProjectId(projectParam);
    const issueId = await this.resolveIssueId(projectId, issueParam);

    let issue = await this.prisma.issue?.findFirst({ where: { id: issueId, projectId } });
    if (!issue) {
      issue = await this.prisma.issue?.findUnique({ where: { id: issueId } });
    }

    if (!issue || (issue.projectId && issue.projectId !== projectId)) {
      throw new NotFoundException('Issue not found in project');
    }

    return { projectId, issueId, issue };
  }

  async findAll(projectParam: string, issueParam: string, queryDto: QueryCommentDto) {
    const { issueId } = await this.verifyIssueInProject(projectParam, issueParam);

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { issueId },
        skip,
        take: limit,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { author: { select: USER_SELECT } },
      }),
      this.prisma.comment.count({ where: { issueId } }),
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

  async create(
    projectParam: string,
    issueParam: string,
    authorId: string,
    dto: CreateCommentDto,
    correlationId?: string,
  ) {
    const { projectId, issueId, issue } = await this.verifyIssueInProject(projectParam, issueParam);

    const createdComment = await this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          issueId,
          authorId,
          content: dto.content,
        },
        include: { author: { select: USER_SELECT } },
      });

      await tx.issueActivity.create({
        data: {
          issueId,
          actorId: authorId,
          type: 'COMMENT_CREATED',
          metadata: {
            commentId: comment.id,
            snippet: dto.content.substring(0, 50),
          },
        },
      });

      return comment;
    });

    try {
      this.eventEmitter.emit('comment.created', { projectId, issueId, comment: createdComment, correlationId });

      const mentionMatches = dto.content.match(/@([\w.-]+)/g);
      if (mentionMatches && mentionMatches.length > 0) {
        const potentialNames = mentionMatches.map(m => m.substring(1));
        
        const members = await this.prisma.projectMember.findMany({
          where: {
            projectId,
            user: {
              OR: potentialNames.flatMap(name => [
                { displayName: { equals: name, mode: 'insensitive' } },
                { firstName: { equals: name, mode: 'insensitive' } },
              ])
            }
          },
          include: { user: true }
        });

        for (const member of members) {
          if (member.userId !== authorId) {
            const notif = await this.notificationsService.createNotification({
              userId: member.userId,
              type: 'COMMENT_MENTION',
              title: 'You were mentioned in a comment',
              message: `${createdComment.author?.displayName || createdComment.author?.firstName || 'Someone'} mentioned you in ${issue.key}`,
              metadata: { projectId, issueId, commentId: createdComment.id, key: issue.key },
              projectId,
              issueId,
              actorId: authorId,
            });
            this.eventEmitter.emit('notification.new', { userId: member.userId, notification: notif });
          }
        }
      }
    } catch (err) {
      console.error('Failed to emit events for comment creation', err);
    }

    return createdComment;
  }

  async update(
    projectParam: string,
    issueParam: string,
    commentId: string,
    userId: string,
    userRole: ProjectRole,
    dto: UpdateCommentDto,
  ) {
    const { issueId } = await this.verifyIssueInProject(projectParam, issueParam);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.issueId !== issueId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId && userRole !== ProjectRole.ADMIN) {
      throw new ForbiddenException('Cannot edit comment of another author');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedComment = await tx.comment.update({
        where: { id: commentId },
        data: { content: dto.content },
        include: { author: { select: USER_SELECT } },
      });

      await tx.issueActivity.create({
        data: {
          issueId,
          actorId: userId,
          type: 'COMMENT_UPDATED',
          metadata: { commentId },
        },
      });

      return updatedComment;
    });
  }

  async remove(
    projectParam: string,
    issueParam: string,
    commentId: string,
    userId: string,
    userRole: ProjectRole,
  ) {
    const { issueId } = await this.verifyIssueInProject(projectParam, issueParam);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.issueId !== issueId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId && userRole !== ProjectRole.ADMIN) {
      throw new ForbiddenException('Cannot delete comment of another author');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({
        where: { id: commentId },
      });

      await tx.issueActivity.create({
        data: {
          issueId,
          actorId: userId,
          type: 'COMMENT_DELETED',
          metadata: { commentId },
        },
      });

      return { success: true };
    });
  }
}
