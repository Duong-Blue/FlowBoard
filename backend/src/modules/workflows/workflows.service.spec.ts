import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '../../database/prisma.service';
import { IssueStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let prisma: any;
  let eventEmitter: any;

  beforeEach(async () => {
    prisma = {
      workflow: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      workflowStatus: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      workflowTransition: {
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
      },
      issue: {
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prisma)),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
  });

  describe('getWorkflow', () => {
    it('should return existing workflow', async () => {
      const mockWorkflow = { id: 'w1', statuses: [], transitions: [] };
      prisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

      const result = await service.getWorkflow('p1');
      expect(result).toBe(mockWorkflow);
      expect(prisma.workflow.create).not.toHaveBeenCalled();
    });

    it('should call createDefaultWorkflow if none exists', async () => {
      prisma.workflow.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'w2' }); // for the return inside createDefaultWorkflow

      prisma.workflow.create.mockResolvedValue({ id: 'w2' });
      prisma.workflowStatus.create.mockResolvedValue({ id: 'mock-status-id' });

      vi.spyOn(service, 'createDefaultWorkflow');

      const result = await service.getWorkflow('p2');
      expect(service.createDefaultWorkflow).toHaveBeenCalledWith('p2');
      expect(prisma.workflow.create).toHaveBeenCalled();
      expect(prisma.workflowStatus.create).toHaveBeenCalledTimes(4);
      expect(prisma.workflowTransition.createMany).toHaveBeenCalled();
      expect(result).toEqual({ id: 'w2' });
    });
  });

  describe('createDefaultWorkflow', () => {
    it('should create default statuses and transitions', async () => {
      prisma.workflow.create.mockResolvedValue({ id: 'w1' });
      prisma.workflowStatus.create
        .mockResolvedValueOnce({ id: 's-todo' })
        .mockResolvedValueOnce({ id: 's-in-progress' })
        .mockResolvedValueOnce({ id: 's-in-preview' })
        .mockResolvedValueOnce({ id: 's-done' });
      prisma.workflow.findUnique.mockResolvedValue({ id: 'w1', statuses: [], transitions: [] });

      const result = await service.createDefaultWorkflow('p1');

      expect(prisma.workflow.create).toHaveBeenCalledWith({ data: { projectId: 'p1' } });
      expect(prisma.workflowStatus.create).toHaveBeenCalledTimes(4);
      expect(prisma.workflowTransition.createMany).toHaveBeenCalledWith({
        data: [
          { workflowId: 'w1', fromStatusId: null, toStatusId: 's-todo' },
          { workflowId: 'w1', fromStatusId: 's-todo', toStatusId: 's-in-progress' },
          { workflowId: 'w1', fromStatusId: 's-in-progress', toStatusId: 's-in-preview' },
          { workflowId: 'w1', fromStatusId: 's-in-preview', toStatusId: 's-done' },
          { workflowId: 'w1', fromStatusId: 's-done', toStatusId: 's-in-progress' },
        ],
      });
      expect(result).toEqual({ id: 'w1', statuses: [], transitions: [] });
    });
  });

  describe('deleteStatus', () => {
    it('should throw if fallbackStatusId is missing', async () => {
      await expect(service.deleteStatus('p1', 's1', '')).rejects.toThrow(BadRequestException);
    });

    it('should throw if fallbackStatusId is the same as statusId', async () => {
      await expect(service.deleteStatus('p1', 's1', 's1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if it is the last status', async () => {
      prisma.workflow.findUnique.mockResolvedValue({
        id: 'w1',
        statuses: [{ id: 's1' }],
      });
      await expect(service.deleteStatus('p1', 's1', 's2')).rejects.toThrow('last remaining status');
    });

    it('should delete status, reassign issues, and delete relations', async () => {
      prisma.workflow.findUnique.mockResolvedValue({
        id: 'w1',
        statuses: [
          { id: 's1', category: IssueStatus.TODO },
          { id: 's2', category: IssueStatus.DONE },
        ],
      });

      await service.deleteStatus('p1', 's1', 's2');
      
      expect(prisma.issue.updateMany).toHaveBeenCalledWith({
        where: { workflowStatusId: 's1' },
        data: { workflowStatusId: 's2', status: IssueStatus.DONE },
      });
      expect(prisma.workflowTransition.deleteMany).toHaveBeenCalledWith({
        where: {
          workflowId: 'w1',
          OR: [
            { fromStatusId: 's1' },
            { toStatusId: 's1' },
          ],
        },
      });
      expect(prisma.workflowStatus.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });
  });

  describe('createTransition', () => {
    it('should throw if fromStatusId equals toStatusId', async () => {
      prisma.workflow.findUnique.mockResolvedValue({ id: 'w1', statuses: [{ id: 's1' }] });
      await expect(service.createTransition('p1', { fromStatusId: 's1', toStatusId: 's1', name: '' })).rejects.toThrow('Cannot transition to the same status');
    });

    it('should throw if statuses do not belong to the workflow', async () => {
      prisma.workflow.findUnique.mockResolvedValue({ id: 'w1', statuses: [{ id: 's1' }] });
      await expect(service.createTransition('p1', { fromStatusId: 's1', toStatusId: 's2', name: '' })).rejects.toThrow('Transition statuses must belong to the workflow');
    });

    it('should throw if transition already exists', async () => {
      prisma.workflow.findUnique.mockResolvedValue({
        id: 'w1',
        statuses: [{ id: 's1' }, { id: 's2' }],
        transitions: [{ fromStatusId: 's1', toStatusId: 's2' }],
      });
      await expect(service.createTransition('p1', { fromStatusId: 's1', toStatusId: 's2', name: '' })).rejects.toThrow('Transition already exists');
    });
  });

  describe('updateTransitionsMatrix', () => {
    it('should throw if any status does not belong to the workflow', async () => {
      prisma.workflow.findUnique.mockResolvedValue({ id: 'w1', statuses: [{ id: 's1' }] });
      await expect(service.updateTransitionsMatrix('p1', { transitions: [{ fromStatusId: 's1', toStatusId: 's2' }] })).rejects.toThrow('Transition statuses must belong to the workflow');
    });

    it('should throw if there is a self transition', async () => {
      prisma.workflow.findUnique.mockResolvedValue({ id: 'w1', statuses: [{ id: 's1' }] });
      await expect(service.updateTransitionsMatrix('p1', { transitions: [{ fromStatusId: 's1', toStatusId: 's1' }] })).rejects.toThrow('Cannot transition to the same status');
    });

    it('should throw if there are duplicate transitions', async () => {
      prisma.workflow.findUnique.mockResolvedValue({ id: 'w1', statuses: [{ id: 's1' }, { id: 's2' }] });
      await expect(service.updateTransitionsMatrix('p1', { transitions: [{ fromStatusId: 's1', toStatusId: 's2' }, { fromStatusId: 's1', toStatusId: 's2' }] })).rejects.toThrow('Duplicate transitions in matrix');
    });

    it('should update matrix successfully', async () => {
      prisma.workflow.findUnique.mockResolvedValue({ id: 'w1', statuses: [{ id: 's1' }, { id: 's2' }] });
      await service.updateTransitionsMatrix('p1', { transitions: [{ fromStatusId: 's1', toStatusId: 's2' }] });
      expect(prisma.workflowTransition.deleteMany).toHaveBeenCalled();
      expect(prisma.workflowTransition.createMany).toHaveBeenCalled();
    });
  });
});
