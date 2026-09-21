import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RelationsService } from './relations.service';
import { CreateRelationDto } from './dto/create-relation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/issues/:issueId/relations')
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) {}

  @Post()
  create(
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRelationDto,
  ) {
    return this.relationsService.create(issueId, userId, dto);
  }

  @Get()
  findAll(@Param('issueId') issueId: string) {
    return this.relationsService.findAll(issueId);
  }

  @Delete(':relationId')
  remove(
    @Param('issueId') issueId: string,
    @Param('relationId') relationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.relationsService.remove(issueId, relationId, userId);
  }
}
