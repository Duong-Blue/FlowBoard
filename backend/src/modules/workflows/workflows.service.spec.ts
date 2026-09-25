import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '../../database/prisma.service';
import { IssueStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let prisma: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        { provide: PrismaService, useValue: prisma },
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

    it('should create default workflow if none exists', async () => {
      prisma.workflow.findUnique.mockResolvedValue(null);
      const mockCreated = { id: 'w2', statuses: [], transitions: [] };
      prisma.workflow.create.mockResolvedValue(mockCreated);

      const result = await service.getWorkflow('p2');
      expect(result).toBe(mockCreated);
      expect(prisma.workflow.create).toHaveBeenCalled();
    });
  });

  describe('deleteStatus', () => {
    it('should throw if fallbackStatusId is missing', async () => {
      await expect(service.deleteStatus('p1', 's1', '')).rejects.toThrow(BadRequestException);
    });

    it('should throw if it is the last status', async () => {
      prisma.workflow.findUnique.mockResolvedValue({
        id: 'w1',
        statuses: [{ id: 's1' }],
      });
      await expect(service.deleteStatus('p1', 's1', 's2')).rejects.toThrow('last remaining status');
    });

    it('should delete status and reassign issues', async () => {
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
      expect(prisma.workflowStatus.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });
  });
});
