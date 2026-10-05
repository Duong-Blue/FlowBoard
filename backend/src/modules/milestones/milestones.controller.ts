import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { AssignIssuesDto } from './dto/assign-issues.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, ProjectMemberGuard, RolesGuard)
@Controller('projects/:projectId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  @Roles(ProjectRole.ADMIN)
  create(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() createMilestoneDto: CreateMilestoneDto,
  ) {
    return this.milestonesService.create(projectId, userId, createMilestoneDto);
  }

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.milestonesService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.milestonesService.findOne(projectId, id);
  }

  @Patch(':id')
  @Roles(ProjectRole.ADMIN)
  update(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.milestonesService.update(projectId, userId, id, updateMilestoneDto);
  }

  @Delete(':id')
  @Roles(ProjectRole.ADMIN)
  remove(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.milestonesService.delete(projectId, userId, id);
  }

  @Put('reorder')
  @Roles(ProjectRole.ADMIN)
  reorder(
    @Param('projectId') projectId: string,
    @Body('milestoneIds') milestoneIds: string[],
  ) {
    return this.milestonesService.reorder(projectId, milestoneIds);
  }

  @Post(':id/issues')
  assignIssues(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: AssignIssuesDto,
  ) {
    return this.milestonesService.assignIssues(projectId, id, dto.issueIds);
  }
}
