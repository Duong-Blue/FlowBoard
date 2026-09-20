import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SubtasksService } from './subtasks.service';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SubtasksService', () => {
  let service: SubtasksService;
  const mockPrisma = {
    issue: { findUnique: vi.fn(), create: vi.fn() },
    project: { update: vi.fn() },
    issueActivity: { create: vi.fn() },
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
    mockPrisma.issue.findUnique.mockResolvedValue({ id: 's1', parentId: 'p1', projectId: 'proj1' });
    await expect(service.create('proj1', 's1', 'u1', { title: 'T' }))
      .rejects.toThrow(BadRequestException);
  });
});
