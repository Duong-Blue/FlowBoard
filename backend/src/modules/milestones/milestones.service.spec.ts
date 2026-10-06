import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesService } from './milestones.service';
import { PrismaService } from '../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { BadRequestException } from '@nestjs/common';

vi.mock('../../database/prisma.service', () => ({
  PrismaService: class {
    milestone = {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    issue = {
      groupBy: vi.fn(),
      updateMany: vi.fn(),
    };
  }
}));

vi.mock('../activity/activity.service', () => ({
  ActivityService: class {
    createActivity = vi.fn();
  }
}));

describe('MilestonesService', () => {
  let service: MilestonesService;
  let prisma: any;
  let _activity: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestonesService,
        PrismaService,
        ActivityService,
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    prisma = module.get<PrismaService>(PrismaService);
    _activity = module.get<ActivityService>(ActivityService);
    vi.clearAllMocks();
  });

  describe('Date range validation', () => {
    it('create() throws BadRequestException if startDate > targetDate', async () => {
      const dto = {
        name: 'Test',
        startDate: new Date('2023-02-01'),
        targetDate: new Date('2023-01-01'),
      };
      await expect(service.create('proj-1', dto)).rejects.toThrow(BadRequestException);
      expect(prisma.milestone.create).not.toHaveBeenCalled();
    });

    it('update() throws BadRequestException if startDate > targetDate', async () => {
      prisma.milestone.findFirst.mockResolvedValue({
        id: 'ms-1',
        startDate: new Date('2023-01-01'),
        targetDate: new Date('2023-12-31'),
        issues: [],
      } as any);
      const dto = { startDate: new Date('2024-01-01') };
      await expect(service.update('proj-1', 'ms-1', dto)).rejects.toThrow(BadRequestException);
      expect(prisma.milestone.update).not.toHaveBeenCalled();
    });
  });

  describe('Progress computation', () => {
    it('findAll() computes progress correctly', async () => {
      prisma.milestone.findMany.mockResolvedValue([{
        id: 'ms-1',
        projectId: 'proj-1',
        _count: { issues: 4 }
      }] as any);
      prisma.issue.groupBy.mockResolvedValue([
        { milestoneId: 'ms-1', status: 'DONE', _count: { id: 3 } },
        { milestoneId: 'ms-1', status: 'TODO', _count: { id: 1 } },
      ] as any);

      const res = await service.findAll('proj-1');
      expect(res[0].totalIssues).toBe(4);
      expect(res[0].completedIssues).toBe(3);
      expect(res[0].progress).toBe(75);
    });

    it('findOne() computes progress correctly', async () => {
      prisma.milestone.findFirst.mockResolvedValue({
        id: 'ms-1',
        projectId: 'proj-1',
        issues: [
          { status: 'DONE' },
          { status: 'DONE' },
          { status: 'TODO' },
          { status: 'IN_PROGRESS' },
        ]
      } as any);

      const res = await service.findOne('proj-1', 'ms-1');
      expect(res.totalIssues).toBe(4);
      expect(res.completedIssues).toBe(2);
      expect(res.progress).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('create() allows creation with missing targetDate and startDate', async () => {
      const dto = {
        name: 'No Dates',
      };
      
      prisma.milestone.findFirst.mockResolvedValue(null);
      prisma.milestone.create.mockResolvedValue({ id: 'ms-2', ...dto, order: 1000 });
      
      const res = await service.create('proj-1', dto);
      
      expect(prisma.milestone.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          projectId: 'proj-1',
          order: 1000,
        },
      });
      expect(res).toBeDefined();
    });

    it('create() allows creating multiple milestones with the same name', async () => {
      const dto = {
        name: 'Duplicate Name',
      };
      
      prisma.milestone.findFirst.mockResolvedValue(null);
      prisma.milestone.create.mockResolvedValue({ id: 'ms-3', ...dto, order: 1000 });
      
      const res = await service.create('proj-1', dto);
      
      expect(prisma.milestone.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          projectId: 'proj-1',
          order: 1000,
        },
      });
      expect(res.id).toBe('ms-3');
    });

    it('create() computes 0% progress if no issues exist', async () => {
      prisma.milestone.findMany.mockResolvedValue([{
        id: 'ms-1',
        projectId: 'proj-1',
        _count: { issues: 0 }
      }] as any);
      prisma.issue.groupBy.mockResolvedValue([] as any);

      const res = await service.findAll('proj-1');
      expect(res[0].totalIssues).toBe(0);
      expect(res[0].completedIssues).toBe(0);
      expect(res[0].progress).toBe(0);
    });
    
    it('findOne() computes 0% progress if no issues exist', async () => {
      prisma.milestone.findFirst.mockResolvedValue({
        id: 'ms-1',
        projectId: 'proj-1',
        issues: []
      } as any);

      const res = await service.findOne('proj-1', 'ms-1');
      expect(res.totalIssues).toBe(0);
      expect(res.completedIssues).toBe(0);
      expect(res.progress).toBe(0);
    });
  });

  describe('delete()', () => {
    it('unlinks issues by setting milestoneId to null before deletion', async () => {
      prisma.milestone.findFirst.mockResolvedValue({
        id: 'ms-1',
        name: 'Del MS',
        projectId: 'proj-1',
        issues: []
      } as any);
      prisma.issue.updateMany.mockResolvedValue({ count: 2 } as any);
      prisma.milestone.delete.mockResolvedValue({ id: 'ms-1' } as any);

      await service.delete('proj-1', 'ms-1');

      expect(prisma.issue.updateMany).toHaveBeenCalledWith({
        where: { milestoneId: 'ms-1' },
        data: { milestoneId: null },
      });
      expect(prisma.milestone.delete).toHaveBeenCalledWith({
        where: { id: 'ms-1' }
      });
    });
  });
});
