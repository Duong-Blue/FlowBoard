import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SubtasksService } from './subtasks.service';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';

describe('SubtasksService', () => {
  let service: SubtasksService;
  const mockPrisma = {
    issue: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    project: { update: vi.fn() },
    issueActivity: { create: vi.fn() },
    workflowStatus: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  const mockEventEmitter = { emit: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubtasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get<SubtasksService>(SubtasksService);
    vi.clearAllMocks();
  });

  it('should reject creation if parent is already a subtask (depth 2)', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({
      id: 's1',
      parentId: 'p1',
      projectId: 'proj1',
    });
    await expect(
      service.create('proj1', 's1', 'u1', { title: 'T' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create a subtask with key: null and not update project issueSequence', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({
      id: 'issue1',
      parentId: null,
      projectId: 'proj1',
      key: 'PROJ-1',
    });
    mockPrisma.workflowStatus.findFirst.mockResolvedValue({ id: 'ws1', category: 'TODO' });
    mockPrisma.issue.findFirst.mockResolvedValue({ order: 'a0' });
    mockPrisma.issue.create.mockResolvedValue({
      id: 'sub1',
      key: null,
      title: 'T',
    });
    mockPrisma.issueActivity.create.mockResolvedValue({});

    const result = await service.create('proj1', 'issue1', 'u1', {
      title: 'T',
    });

    expect(result).toEqual({ id: 'sub1', key: null, title: 'T' });
    expect(mockPrisma.project.update).not.toHaveBeenCalled();
    expect(mockPrisma.issue.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          key: null,
          title: 'T',
          parentId: 'issue1',
        }),
      }),
    );
  });
});
