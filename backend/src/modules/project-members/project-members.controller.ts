import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { AddProjectMemberDto } from './add-project-member.dto';
import { UpdateProjectMemberRoleDto } from './update-project-member-role.dto';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly service: ProjectMembersService) {}

  @Post()
  add(@Param('projectId') projectId: string, @Req() req, @Body() dto: AddProjectMemberDto) {
    return this.service.add(projectId, dto, req.user.id);
  }

  @Get()
  findAll(@Param('projectId') projectId: string, @Req() req) {
    return this.service.findAll(projectId, req.user.id);
  }

  @Patch(':userId')
  updateRole(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @Req() req,
    @Body() dto: UpdateProjectMemberRoleDto,
  ) {
    return this.service.updateRole(projectId, targetUserId, req.user.id, dto.role);
  }

  @Delete(':userId')
  remove(@Param('projectId') projectId: string, @Param('userId') targetUserId: string, @Req() req) {
    return this.service.remove(projectId, targetUserId, req.user.id);
  }
}
