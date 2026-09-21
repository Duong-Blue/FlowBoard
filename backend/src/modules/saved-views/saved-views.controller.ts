import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SavedViewsService } from './saved-views.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';
import { UpdateSavedViewDto } from './dto/update-saved-view.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentProjectMember } from '../../common/decorators/current-project-member.decorator';
import { ProjectRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/saved-views')
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Body() dto: CreateSavedViewDto,
  ) {
    return this.savedViewsService.create(projectId, userId, role, dto);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.savedViewsService.findAll(projectId, userId);
  }

  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.savedViewsService.findOne(projectId, id, userId);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
    @Body() dto: UpdateSavedViewDto,
  ) {
    return this.savedViewsService.update(projectId, id, userId, role, dto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentProjectMember('role') role: ProjectRole,
  ) {
    return this.savedViewsService.remove(projectId, id, userId, role);
  }
}
