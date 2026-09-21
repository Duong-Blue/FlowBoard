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
import { Throttle } from '@nestjs/throttler';
import { IssuesService } from './issues.service';
import { SubtasksService } from './subtasks.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueQueryDto } from './dto/issue-query.dto';
import { MoveIssueDto } from './dto/move-issue.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
  constructor(
    private readonly issuesService: IssuesService,
    private readonly subtasksService: SubtasksService,
  ) {}

  @Throttle({ default: { limit: 60, ttl: 60000 } })
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

  @Post(':issueId/subtasks')
  createSubtask(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.subtasksService.create(projectId, issueId, userId, dto);
  }

  @Get(':issueId/subtasks')
  getSubtasks(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ) {
    return this.subtasksService.findAll(projectId, issueId);
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

  @Throttle({ default: { limit: 120, ttl: 60000 } })
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

  @Throttle({ default: { limit: 120, ttl: 60000 } })
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

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Delete(':issueId')
  delete(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Query('force') force?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.issuesService.delete(projectId, issueId, userId, role, force === 'true', correlationId);
  }
}
