import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@prisma/client';
import { CreateCommentDto, UpdateCommentDto, QueryCommentDto } from './dto';

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
  constructor(private readonly prisma: PrismaService) {}

  private async verifyIssueInProject(projectId: string, issueId: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue || issue.projectId !== projectId) {
      throw new NotFoundException('Issue not found in project');
    }

    return issue;
  }

  async findAll(projectId: string, issueId: string, queryDto: QueryCommentDto) {
    await this.verifyIssueInProject(projectId, issueId);

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
    projectId: string,
    issueId: string,
    authorId: string,
    dto: CreateCommentDto,
  ) {
    await this.verifyIssueInProject(projectId, issueId);

    return this.prisma.$transaction(async (tx) => {
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
  }

  async update(
    projectId: string,
    issueId: string,
    commentId: string,
    userId: string,
    userRole: ProjectRole,
    dto: UpdateCommentDto,
  ) {
    await this.verifyIssueInProject(projectId, issueId);

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
    projectId: string,
    issueId: string,
    commentId: string,
    userId: string,
    userRole: ProjectRole,
  ) {
    await this.verifyIssueInProject(projectId, issueId);

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
