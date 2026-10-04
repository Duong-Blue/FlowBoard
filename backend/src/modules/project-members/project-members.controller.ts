import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectRole, OrgRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, ProjectMemberGuard, RolesGuard)
@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly service: ProjectMembersService) {}

  @Post()
  @Roles(ProjectRole.ADMIN, OrgRole.ADMIN)
  add(
    @Param('projectId') projectId: string,
    @Req() req,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.service.add(projectId, dto, req.user.id);
  }

  @Get()
  findAll(@Param('projectId') projectId: string, @Req() req) {
    return this.service.findAll(projectId, req.user.id);
  }

  @Patch(':userId')
  @Roles(ProjectRole.ADMIN, OrgRole.ADMIN)
  updateRole(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @Req() req,
    @Body() dto: UpdateProjectMemberRoleDto,
  ) {
    return this.service.updateRole(
      projectId,
      targetUserId,
      req.user.id,
      dto.role,
    );
  }

  @Delete(':userId')
  @Roles(ProjectRole.ADMIN, OrgRole.ADMIN)
  remove(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @Req() req,
  ) {
    return this.service.remove(projectId, targetUserId, req.user.id);
  }
}

