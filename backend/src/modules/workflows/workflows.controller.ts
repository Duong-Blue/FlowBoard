import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateTransitionDto } from './dto/create-transition.dto';
import { UpdateTransitionsMatrixDto } from './dto/update-transitions-matrix.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectRole } from '@prisma/client';

@Controller('projects/:projectId/workflows')
@UseGuards(JwtAuthGuard, ProjectMemberGuard, RolesGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async getWorkflow(@Param('projectId') projectId: string) {
    return this.workflowsService.getWorkflow(projectId);
  }

  @Post('statuses')
  @Roles(ProjectRole.ADMIN)
  async createStatus(
    @Param('projectId') projectId: string,
    @Body() dto: CreateStatusDto,
  ) {
    return this.workflowsService.createStatus(projectId, dto);
  }

  @Put('statuses/:statusId')
  @Roles(ProjectRole.ADMIN)
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.workflowsService.updateStatus(projectId, statusId, dto);
  }

  @Delete('statuses/:statusId')
  @Roles(ProjectRole.ADMIN)
  async deleteStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Query('fallbackStatusId') fallbackStatusId: string,
  ) {
    return this.workflowsService.deleteStatus(projectId, statusId, fallbackStatusId);
  }

  @Post('transitions')
  @Roles(ProjectRole.ADMIN)
  async createTransition(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTransitionDto,
  ) {
    return this.workflowsService.createTransition(projectId, dto);
  }

  @Delete('transitions/:transitionId')
  @Roles(ProjectRole.ADMIN)
  async deleteTransition(
    @Param('projectId') projectId: string,
    @Param('transitionId') transitionId: string,
  ) {
    return this.workflowsService.deleteTransition(projectId, transitionId);
  }

  @Put('transitions/matrix')
  @Roles(ProjectRole.ADMIN)
  async updateTransitionsMatrix(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateTransitionsMatrixDto,
  ) {
    return this.workflowsService.updateTransitionsMatrix(projectId, dto);
  }
}
