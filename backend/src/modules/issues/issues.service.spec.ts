import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { IssuesService } from './issues.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';

describe('IssuesService', () => {
  let service: IssuesService;

  const mockPrisma = {
    projectMember: { findUnique: vi.fn() },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
    project: { update: vi.fn(), findFirst: vi.fn() },
    issue: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    issueActivity: {
      create: vi.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IssuesService>(IssuesService);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create issue and format key correctly', async () => {
      mockPrisma.project.update.mockResolvedValue({ key: 'PROJ', issueSequence: 5 });
      mockPrisma.issue.create.mockResolvedValue({ key: 'PROJ-5' });

      const result = await service.create('p1', 'u1', { title: 'Test' }, ProjectRole.ADMIN);

      expect(result.key).toBe('PROJ-5');
      expect(mockPrisma.issue.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ key: 'PROJ-5' })
      }));
    });

    it('should throw ForbiddenException if user is VIEWER', async () => {
      await expect(service.create('p1', 'u1', { title: 'T' }, ProjectRole.VIEWER))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if assignee is not member', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      await expect(service.create('p1', 'u1', { title: 'T', assigneeId: 'a1' }, ProjectRole.MEMBER))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException on IDOR attempt', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue(null);
      await expect(service.findOne('p1', 'wrong-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException for non-ADMIN', async () => {
      await expect(service.delete('p1', 'i1', ProjectRole.MEMBER))
        .rejects.toThrow(ForbiddenException);
      await expect(service.delete('p1', 'i1', ProjectRole.VIEWER))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
