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
  Headers,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueQueryDto } from './dto/issue-query.dto';
import { MoveIssueDto } from './dto/move-issue.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentProjectMember } from '../../common/decorators/current-project-member.decorator';
import { ProjectRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/board')
export class BoardController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  getBoard(@Param('projectId') projectId: string) {
    return this.issuesService.getBoard(projectId);
  }
}

@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Body() dto: CreateIssueDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.issuesService.create(projectId, userId, dto, role, correlationId);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: IssueQueryDto,
  ) {
    return this.issuesService.findAll(projectId, query);
  }

  @Get(':issueId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ) {
    return this.issuesService.findOne(projectId, issueId);
  }

  @Patch(':issueId/move')
  move(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Body() dto: MoveIssueDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.issuesService.moveIssue(projectId, issueId, userId, dto, role, correlationId);
  }

  @Patch(':issueId')
  update(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Body() dto: UpdateIssueDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.issuesService.update(projectId, issueId, userId, dto, role, correlationId);
  }

  @Delete(':issueId')
  delete(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.issuesService.delete(projectId, issueId, userId, role, correlationId);
  }
}
