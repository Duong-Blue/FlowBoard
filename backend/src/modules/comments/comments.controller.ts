import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentProjectMember } from '../../common/decorators/current-project-member.decorator';
import { ProjectRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/issues/:issueId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Query() queryDto: QueryCommentDto,
  ) {
    return this.commentsService.findAll(projectId, issueId, queryDto);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Body() dto: CreateCommentDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    if (role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot create comments');
    }
    return this.commentsService.create(
      projectId,
      issueId,
      userId,
      dto,
      correlationId,
    );
  }

  @Patch(':commentId')
  update(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Body() dto: UpdateCommentDto,
  ) {
    if (role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot update comments');
    }
    return this.commentsService.update(
      projectId,
      issueId,
      commentId,
      userId,
      role,
      dto,
    );
  }

  @Delete(':commentId')
  remove(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
  ) {
    if (role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot delete comments');
    }
    return this.commentsService.remove(
      projectId,
      issueId,
      commentId,
      userId,
      role,
    );
  }
}
