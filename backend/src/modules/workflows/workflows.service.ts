import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateTransitionDto } from './dto/create-transition.dto';
import { UpdateTransitionsMatrixDto } from './dto/update-transitions-matrix.dto';
import { IssueStatus, Prisma } from '@prisma/client';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

  async createDefaultWorkflow(projectId: string, tx: Prisma.TransactionClient = this.prisma) {
    const workflow = await tx.workflow.create({
      data: { projectId },
    });

    const todo = await tx.workflowStatus.create({
      data: { workflowId: workflow.id, name: 'To Do', category: IssueStatus.TODO, order: 0, color: '#e2e8f0' },
    });
    const inProgress = await tx.workflowStatus.create({
      data: { workflowId: workflow.id, name: 'In Progress', category: IssueStatus.IN_PROGRESS, order: 1, color: '#bfdbfe' },
    });
    const inPreview = await tx.workflowStatus.create({
      data: { workflowId: workflow.id, name: 'In Preview', category: IssueStatus.IN_PREVIEW, order: 2, color: '#fef08a' },
    });
    const done = await tx.workflowStatus.create({
      data: { workflowId: workflow.id, name: 'Done', category: IssueStatus.DONE, order: 3, color: '#bbf7d0' },
    });

    await tx.workflowTransition.createMany({
      data: [
        { workflowId: workflow.id, fromStatusId: null, toStatusId: todo.id },
        { workflowId: workflow.id, fromStatusId: todo.id, toStatusId: inProgress.id },
        { workflowId: workflow.id, fromStatusId: inProgress.id, toStatusId: inPreview.id },
        { workflowId: workflow.id, fromStatusId: inPreview.id, toStatusId: done.id },
        { workflowId: workflow.id, fromStatusId: done.id, toStatusId: inProgress.id },
      ],
    });

    return tx.workflow.findUnique({
      where: { id: workflow.id },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        transitions: true,
      },
    }) as Promise<NonNullable<Awaited<ReturnType<typeof tx.workflow.findUnique>>>>;
  }

  async getWorkflow(projectId: string) {
    let workflow = await this.prisma.workflow.findUnique({
      where: { projectId },
      include: {
        statuses: {
          orderBy: { order: 'asc' },
        },
        transitions: true,
      },
    });

    if (!workflow) {
      // Create default workflow
      workflow = (await this.createDefaultWorkflow(projectId)) as any;
    }

    return workflow;
  }

  async createStatus(projectId: string, dto: CreateStatusDto) {
    const workflow = await this.getWorkflow(projectId);
    const order = dto.order ?? workflow.statuses.length;
    
    const status = await this.prisma.workflowStatus.create({
      data: {
        workflowId: workflow.id,
        name: dto.name,
        category: dto.category,
        order,
        color: dto.color,
      },
    });

    this.eventEmitter.emit('workflow.updated', { projectId });
    return status;
  }

  async updateStatus(projectId: string, statusId: string, dto: UpdateStatusDto) {
    const workflow = await this.getWorkflow(projectId);
    
    const status = await this.prisma.workflowStatus.update({
      where: { id: statusId, workflowId: workflow.id },
      data: dto,
    });

    this.eventEmitter.emit('workflow.updated', { projectId });
    return status;
  }

  async deleteStatus(projectId: string, statusId: string, fallbackStatusId: string) {
    if (!fallbackStatusId) {
      throw new BadRequestException('fallbackStatusId is required');
    }

    if (statusId === fallbackStatusId) {
      throw new BadRequestException('fallbackStatusId cannot be the same as the status being deleted');
    }

    const workflow = await this.getWorkflow(projectId);

    if (workflow.statuses.length <= 1) {
      throw new BadRequestException('Cannot delete the last remaining status of a workflow');
    }

    const statusToDelete = workflow.statuses.find(s => s.id === statusId);
    const fallbackStatus = workflow.statuses.find(s => s.id === fallbackStatusId);

    if (!statusToDelete) throw new BadRequestException('Status to delete not found in this workflow');
    if (!fallbackStatus) throw new BadRequestException('Fallback status not found in this workflow');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.issue.updateMany({
        where: { workflowStatusId: statusId },
        data: { workflowStatusId: fallbackStatusId, status: fallbackStatus.category },
      });

      await tx.workflowTransition.deleteMany({
        where: {
          workflowId: workflow.id,
          OR: [
            { fromStatusId: statusId },
            { toStatusId: statusId },
          ],
        },
      });

      return tx.workflowStatus.delete({
        where: { id: statusId },
      });
    });

    this.eventEmitter.emit('workflow.updated', { projectId });
    return result;
  }

  async createTransition(projectId: string, dto: CreateTransitionDto) {
    const workflow = await this.getWorkflow(projectId);

    if (dto.fromStatusId === dto.toStatusId) {
      throw new BadRequestException('Cannot transition to the same status');
    }

    const fromStatus = workflow.statuses.find(s => s.id === dto.fromStatusId);
    const toStatus = workflow.statuses.find(s => s.id === dto.toStatusId);

    if (!fromStatus || !toStatus) {
      throw new BadRequestException('Transition statuses must belong to the workflow');
    }

    const existing = workflow.transitions.find(
      t => t.fromStatusId === dto.fromStatusId && t.toStatusId === dto.toStatusId
    );
    if (existing) {
      throw new BadRequestException('Transition already exists');
    }

    const transition = await this.prisma.workflowTransition.create({
      data: {
        workflowId: workflow.id,
        fromStatusId: dto.fromStatusId,
        toStatusId: dto.toStatusId,
        name: dto.name,
      },
    });

    this.eventEmitter.emit('workflow.updated', { projectId });
    return transition;
  }

  async deleteTransition(projectId: string, transitionId: string) {
    const workflow = await this.getWorkflow(projectId);
    const transition = await this.prisma.workflowTransition.delete({
      where: { id: transitionId, workflowId: workflow.id },
    });

    this.eventEmitter.emit('workflow.updated', { projectId });
    return transition;
  }

  async updateTransitionsMatrix(projectId: string, dto: UpdateTransitionsMatrixDto) {
    const workflow = await this.getWorkflow(projectId);
    
    if (dto.transitions && dto.transitions.length > 0) {
      const validStatusIds = new Set(workflow.statuses.map(s => s.id));
      const seen = new Set<string>();

      for (const t of dto.transitions) {
        if (!validStatusIds.has(t.fromStatusId) || !validStatusIds.has(t.toStatusId)) {
          throw new BadRequestException('Transition statuses must belong to the workflow');
        }
        if (t.fromStatusId === t.toStatusId) {
          throw new BadRequestException('Cannot transition to the same status');
        }
        const key = `${t.fromStatusId}->${t.toStatusId}`;
        if (seen.has(key)) {
          throw new BadRequestException('Duplicate transitions in matrix');
        }
        seen.add(key);
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.workflowTransition.deleteMany({
        where: { workflowId: workflow.id },
      });

      if (dto.transitions && dto.transitions.length > 0) {
        await tx.workflowTransition.createMany({
          data: dto.transitions.map(t => ({
            workflowId: workflow.id,
            fromStatusId: t.fromStatusId,
            toStatusId: t.toStatusId,
          })),
        });
      }

      return tx.workflowTransition.findMany({
        where: { workflowId: workflow.id },
      });
    });

    this.eventEmitter.emit('workflow.updated', { projectId });
    return result;
  }
}
