import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { ActivityService } from './activity.service';
import { QueryActivityDto } from './dto/query-activity.dto';

@Controller('projects/:projectId/issues/:issueId/activity')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Query() queryDto: QueryActivityDto,
  ) {
    return this.activityService.findAll(projectId, issueId, queryDto);
  }
}
