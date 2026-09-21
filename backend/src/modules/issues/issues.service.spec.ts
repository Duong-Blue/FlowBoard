import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { IssuesService } from './issues.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ProjectRole, IssueStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';

describe('IssuesService', () => {
  let service: IssuesService;

  const mockPrisma = {
    projectMember: { findUnique: vi.fn() },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
    project: { update: vi.fn(), findFirst: vi.fn() },
    issue: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    issueActivity: { create: vi.fn() },
    issueRelation: { findMany: vi.fn() },
  };

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  const mockNotificationsService = {
    createNotification: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: NotificationsService, useValue: mockNotificationsService },
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

  describe('computeDeadlineState', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-21T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return NO_DUE_DATE if dueDate is null', () => {
      expect(service['computeDeadlineState'](IssueStatus.TODO, null, null)).toBe('NO_DUE_DATE');
    });

    it('should return COMPLETED if status is DONE', () => {
      expect(service['computeDeadlineState'](IssueStatus.DONE, new Date('2026-09-22T12:00:00Z'), null)).toBe('COMPLETED');
    });

    it('should return OVERDUE if dueDate is in the past', () => {
      expect(service['computeDeadlineState'](IssueStatus.TODO, new Date('2026-09-21T11:00:00Z'), null)).toBe('OVERDUE');
    });

    it('should return DUE_SOON if dueDate is within 48 hours', () => {
      expect(service['computeDeadlineState'](IssueStatus.TODO, new Date('2026-09-23T11:00:00Z'), null)).toBe('DUE_SOON');
    });

    it('should return UPCOMING if dueDate is more than 48 hours away', () => {
      expect(service['computeDeadlineState'](IssueStatus.TODO, new Date('2026-09-23T13:00:00Z'), null)).toBe('UPCOMING');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-21T12:00:00Z'));
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set completedAt to current date when status becomes DONE', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue({ id: 'i1', projectId: 'p1', status: IssueStatus.IN_PROGRESS, parentId: null });
      mockPrisma.issueRelation = { findMany: vi.fn().mockResolvedValue([]) };
      mockPrisma.issue.update.mockResolvedValue({ id: 'i1', status: IssueStatus.DONE, completedAt: new Date('2026-09-21T12:00:00Z') });

      await service.update('p1', 'i1', 'u1', { status: IssueStatus.DONE }, ProjectRole.ADMIN);

      expect(mockPrisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: IssueStatus.DONE,
            completedAt: new Date('2026-09-21T12:00:00Z'),
          })
        })
      );
    });

    it('should reset completedAt to null when status leaves DONE', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue({ id: 'i1', projectId: 'p1', status: IssueStatus.DONE, parentId: null });
      mockPrisma.issueRelation = { findMany: vi.fn().mockResolvedValue([]) };
      mockPrisma.issue.update.mockResolvedValue({ id: 'i1', status: IssueStatus.IN_PROGRESS, completedAt: null });

      await service.update('p1', 'i1', 'u1', { status: IssueStatus.IN_PROGRESS }, ProjectRole.ADMIN);

      expect(mockPrisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: IssueStatus.IN_PROGRESS,
            completedAt: null,
          })
        })
      );
    });

    it('should auto-complete parent when final subtask reaches DONE', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue({ id: 's1', projectId: 'p1', status: IssueStatus.IN_PROGRESS, parentId: 'parent1' });
      mockPrisma.issueRelation = { findMany: vi.fn().mockResolvedValue([]) };
      mockPrisma.issue.update.mockResolvedValue({ id: 's1', status: IssueStatus.DONE });
      
      mockPrisma.issue.findMany.mockResolvedValue([{ status: IssueStatus.DONE }]);
      mockPrisma.issue.findUnique.mockResolvedValue({ id: 'parent1', status: IssueStatus.IN_PROGRESS });

      await service.update('p1', 's1', 'u1', { status: IssueStatus.DONE }, ProjectRole.ADMIN);

      expect(mockPrisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'parent1' },
          data: { status: IssueStatus.DONE, completedAt: new Date('2026-09-21T12:00:00Z') }
        })
      );
    });
  });

  describe('delete', () => {
    it('should throw ConflictException if issue has subtasks and force is not true', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.issue.findFirst.mockResolvedValue({ id: 'i1', projectId: 'p1' });
      mockPrisma.issue.count.mockResolvedValue(2);

      await expect(service.delete('p1', 'i1', 'u1', ProjectRole.ADMIN, false))
        .rejects.toThrow(ConflictException);
    });

    it('should delete issue if force is true even with subtasks', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.issue.findFirst.mockResolvedValue({ id: 'i1', projectId: 'p1' });
      mockPrisma.issue.count.mockResolvedValue(2);

      await service.delete('p1', 'i1', 'u1', ProjectRole.ADMIN, true);

      expect(mockPrisma.issue.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid transitions', async () => {
      await expect(service['validateStatusTransition'](
        IssueStatus.TODO, IssueStatus.IN_PROGRESS, ProjectRole.MEMBER, false
      )).resolves.not.toThrow();
    });

    it('should throw for invalid transition', async () => {
      await expect(service['validateStatusTransition'](
        IssueStatus.TODO, IssueStatus.DONE, ProjectRole.MEMBER, false
      )).rejects.toThrow(BadRequestException);
    });

    it('should throw for DONE transition if blocked', async () => {
      await expect(service['validateStatusTransition'](
        IssueStatus.IN_PROGRESS, IssueStatus.DONE, ProjectRole.ADMIN, true
      )).rejects.toThrow('Cannot move issue to DONE while it is blocked by unresolved issues');
    });
  });
});
