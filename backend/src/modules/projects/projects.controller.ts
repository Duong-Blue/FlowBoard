import { Controller, Post, Body, Get, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('organizations/:orgId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Param('orgId') orgId: string, @CurrentUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(orgId, userId, dto);
  }

  @Get()
  findAll(@Param('orgId') orgId: string, @CurrentUser('id') userId: string) {
    return this.projectsService.findAll(orgId, userId);
  }

  @UseGuards(ProjectMemberGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.findOne(id, userId);
  }

  @UseGuards(ProjectMemberGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, userId, dto);
  }

  @UseGuards(ProjectMemberGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.delete(id, userId);
  }
}
