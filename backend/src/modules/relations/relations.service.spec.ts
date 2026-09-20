import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RelationsService } from './relations.service';
import { PrismaService } from '../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { BadRequestException } from '@nestjs/common';

describe('RelationsService', () => {
  let service: RelationsService;
  const mockPrisma = {
    issue: { findUnique: vi.fn() },
    issueRelation: { findFirst: vi.fn(), create: vi.fn() },
  };
  const mockActivity = { createActivity: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ActivityService, useValue: mockActivity },
      ],
    }).compile();
    service = module.get<RelationsService>(RelationsService);
    vi.clearAllMocks();
  });

  it('should reject self-linking', async () => {
    await expect(service.create('i1', 'u1', { targetIssueId: 'i1', type: 'BLOCKS' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should reject duplicates', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({ id: 'any' });
    mockPrisma.issueRelation.findFirst.mockResolvedValue({ id: 'rel1' });
    await expect(service.create('i1', 'u1', { targetIssueId: 'i2', type: 'BLOCKS' }))
      .rejects.toThrow('Relation already exists');
  });
});
