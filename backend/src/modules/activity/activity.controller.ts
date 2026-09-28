import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { ActivityService } from './activity.service';
import { QueryActivityDto } from './dto/query-activity.dto';

@Controller('')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('projects/:projectId/issues/:issueId/activity')
  @UseGuards(ProjectMemberGuard)
  async findIssueActivities(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Query() queryDto: QueryActivityDto,
  ) {
    return this.activityService.findAll(projectId, issueId, queryDto);
  }

  @Get('projects/:projectId/activity')
  @UseGuards(ProjectMemberGuard)
  async findProjectActivities(
    @Param('projectId') projectId: string,
    @Query() queryDto: QueryActivityDto,
  ) {
    return this.activityService.findProjectActivities(projectId, queryDto);
  }

  @Get('organizations/:orgId/activity')
  @UseGuards(OrgMemberGuard)
  async findOrgActivities(
    @Param('orgId') orgId: string,
    @Query() queryDto: QueryActivityDto,
  ) {
    return this.activityService.findOrgActivities(orgId, queryDto);
  }
}
