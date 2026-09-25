import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { IssuesService } from './issues.service';
import { PrismaService } from '../../database/prisma.service';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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
    workflow: { findUnique: vi.fn(), create: vi.fn(), findUniqueOrThrow: vi.fn() },
    workflowStatus: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
    workflowTransition: { createMany: vi.fn(), findFirst: vi.fn() },
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
    beforeEach(() => {
      mockPrisma.workflow.findUnique.mockResolvedValue({
        id: 'wf1',
        statuses: [{ id: 'ws1', category: IssueStatus.TODO }],
        transitions: [],
      });
    });

    it('should create issue and format key correctly', async () => {
      mockPrisma.project.update.mockResolvedValue({
        key: 'PROJ',
        issueSequence: 5,
      });
      mockPrisma.issue.create.mockResolvedValue({ key: 'PROJ-5' });

      const result = await service.create(
        'p1',
        'u1',
        { title: 'Test' },
        ProjectRole.ADMIN,
      );

      expect(result.key).toBe('PROJ-5');
      expect(mockPrisma.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ key: 'PROJ-5' }),
        }),
      );
    });

    it('should throw ForbiddenException if user is VIEWER', async () => {
      await expect(
        service.create('p1', 'u1', { title: 'T' }, ProjectRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if assignee is not member', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      await expect(
        service.create(
          'p1',
          'u1',
          { title: 'T', assigneeId: 'a1' },
          ProjectRole.MEMBER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.issue.findMany.mockResolvedValue([]);
      mockPrisma.issue.count.mockResolvedValue(0);
    });

    it('should throw BadRequestException if date range exceeds 180 days with startDateFrom and startDateTo', async () => {
      await expect(
        service.findAll('p1', {
          startDateFrom: '2026-01-01T00:00:00Z',
          startDateTo: '2026-08-01T00:00:00Z',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should query with OR conditions for overlapping date ranges', async () => {
      await service.findAll('p1', {
        startDateFrom: '2026-05-01T00:00:00Z',
        startDateTo: '2026-05-15T00:00:00Z',
      });

      expect(mockPrisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                OR: [
                  { dueDate: { gte: new Date('2026-05-01T00:00:00Z') } },
                  { dueDate: null, startDate: { gte: new Date('2026-05-01T00:00:00Z') } },
                ],
              },
              {
                OR: [
                  { startDate: { lte: new Date('2026-05-15T00:00:00Z') } },
                  { startDate: null, dueDate: { lte: new Date('2026-05-15T00:00:00Z') } },
                ],
              },
            ]),
          }),
        })
      );
    });

    it('should throw BadRequestException if date range exceeds 180 days with dueDateFrom and dueDateTo only', async () => {
      await expect(
        service.findAll('p1', {
          dueDateFrom: '2026-01-01T00:00:00Z',
          dueDateTo: '2026-08-01T00:00:00Z',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException on IDOR attempt', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue(null);
      await expect(service.findOne('p1', 'wrong-id')).rejects.toThrow(
        NotFoundException,
      );
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
      expect(
        service['computeDeadlineState'](IssueStatus.TODO, null, null),
      ).toBe('NO_DUE_DATE');
    });

    it('should return COMPLETED if status is DONE', () => {
      expect(
        service['computeDeadlineState'](
          IssueStatus.DONE,
          new Date('2026-09-22T12:00:00Z'),
          null,
        ),
      ).toBe('COMPLETED');
    });

    it('should return OVERDUE if dueDate is in the past', () => {
      expect(
        service['computeDeadlineState'](
          IssueStatus.TODO,
          new Date('2026-09-21T11:00:00Z'),
          null,
        ),
      ).toBe('OVERDUE');
    });

    it('should return DUE_SOON if dueDate is within 48 hours', () => {
      expect(
        service['computeDeadlineState'](
          IssueStatus.TODO,
          new Date('2026-09-23T11:00:00Z'),
          null,
        ),
      ).toBe('DUE_SOON');
    });

    it('should return UPCOMING if dueDate is more than 48 hours away', () => {
      expect(
        service['computeDeadlineState'](
          IssueStatus.TODO,
          new Date('2026-09-23T13:00:00Z'),
          null,
        ),
      ).toBe('UPCOMING');
    });
  });

  describe('getBoard', () => {
    it('should return array of issues with workflowStatus', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.issue.findMany.mockResolvedValue([
        { id: 'i1', status: IssueStatus.TODO, workflowStatusId: 'ws1', workflowStatus: { id: 'ws1', category: IssueStatus.TODO } },
      ]);

      const result = await service.getBoard('p1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('i1');
      expect(result[0].workflowStatus).toBeDefined();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-21T12:00:00Z'));
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.workflow.findUnique.mockResolvedValue({
        id: 'wf1',
        statuses: [
          { id: 'ws-in-progress', category: IssueStatus.IN_PROGRESS },
          { id: 'ws-done', category: IssueStatus.DONE }
        ],
        transitions: [],
      });
      mockPrisma.workflowTransition.findFirst.mockResolvedValue({});
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set completedAt to current date when status becomes DONE', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue({
        id: 'i1',
        projectId: 'p1',
        status: IssueStatus.IN_PROGRESS,
        parentId: null,
      });
      mockPrisma.issueRelation = { findMany: vi.fn().mockResolvedValue([]) };
      mockPrisma.issue.update.mockResolvedValue({
        id: 'i1',
        status: IssueStatus.DONE,
        completedAt: new Date('2026-09-21T12:00:00Z'),
      });

      await service.update(
        'p1',
        'i1',
        'u1',
        { status: IssueStatus.DONE },
        ProjectRole.ADMIN,
      );

      expect(mockPrisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: IssueStatus.DONE,
            completedAt: new Date('2026-09-21T12:00:00Z'),
          }),
        }),
      );
    });

    it('should reset completedAt to null when status leaves DONE', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue({
        id: 'i1',
        projectId: 'p1',
        status: IssueStatus.DONE,
        parentId: null,
      });
      mockPrisma.issueRelation = { findMany: vi.fn().mockResolvedValue([]) };
      mockPrisma.issue.update.mockResolvedValue({
        id: 'i1',
        status: IssueStatus.IN_PROGRESS,
        completedAt: null,
      });

      await service.update(
        'p1',
        'i1',
        'u1',
        { status: IssueStatus.IN_PROGRESS },
        ProjectRole.ADMIN,
      );

      expect(mockPrisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: IssueStatus.IN_PROGRESS,
            completedAt: null,
          }),
        }),
      );
    });

    it('should auto-complete parent when final subtask reaches DONE', async () => {
      mockPrisma.issue.findFirst.mockResolvedValue({
        id: 's1',
        projectId: 'p1',
        status: IssueStatus.IN_PROGRESS,
        parentId: 'parent1',
      });
      mockPrisma.issueRelation = { findMany: vi.fn().mockResolvedValue([]) };
      mockPrisma.issue.update.mockResolvedValue({
        id: 's1',
        status: IssueStatus.DONE,
      });

      mockPrisma.issue.findMany.mockResolvedValue([
        { status: IssueStatus.DONE },
      ]);
      mockPrisma.issue.findUnique.mockResolvedValue({
        id: 'parent1',
        status: IssueStatus.IN_PROGRESS,
        projectId: 'p1',
        workflowStatusId: 'ws_in_progress',
      });
      mockPrisma.workflowStatus.findUnique.mockResolvedValue({
        id: 'ws_in_progress',
        category: IssueStatus.IN_PROGRESS,
      });
      mockPrisma.workflowStatus.findMany.mockResolvedValue([
        { id: 'ws_done', category: IssueStatus.DONE },
      ]);

      await service.update(
        'p1',
        's1',
        'u1',
        { status: IssueStatus.DONE },
        ProjectRole.ADMIN,
      );

      expect(mockPrisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'parent1' },
          data: expect.objectContaining({
            status: IssueStatus.DONE,
            completedAt: new Date('2026-09-21T12:00:00Z'),
          }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('should throw ConflictException if issue has subtasks and force is not true', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.issue.findFirst.mockResolvedValue({
        id: 'i1',
        projectId: 'p1',
      });
      mockPrisma.issue.count.mockResolvedValue(2);

      await expect(
        service.delete('p1', 'i1', 'u1', ProjectRole.ADMIN, false),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete issue if force is true even with subtasks', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.issue.findFirst.mockResolvedValue({
        id: 'i1',
        projectId: 'p1',
      });
      mockPrisma.issue.count.mockResolvedValue(2);

      await service.delete('p1', 'i1', 'u1', ProjectRole.ADMIN, true);

      expect(mockPrisma.issue.delete).toHaveBeenCalledWith({
        where: { id: 'i1' },
      });
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid transitions', async () => {
      mockPrisma.workflowTransition.findFirst.mockResolvedValue({});
      await expect(
        service['validateStatusTransition'](
          'wf1',
          'ws1',
          'ws2',
          IssueStatus.IN_PROGRESS,
          ProjectRole.MEMBER,
          false,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw for invalid transition', async () => {
      mockPrisma.workflowTransition.findFirst.mockResolvedValue(null);
      await expect(
        service['validateStatusTransition'](
          'wf1',
          'ws1',
          'ws2',
          IssueStatus.DONE,
          ProjectRole.MEMBER,
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for DONE transition if blocked', async () => {
      mockPrisma.workflowTransition.findFirst.mockResolvedValue({});
      await expect(
        service['validateStatusTransition'](
          'wf1',
          'ws1',
          'ws2',
          IssueStatus.DONE,
          ProjectRole.ADMIN,
          true,
        ),
      ).rejects.toThrow(
        'Cannot move issue to DONE while it is blocked by unresolved issues',
      );
    });
  
  describe('getWorkload', () => {
    it('should aggregate workload correctly without subtasks', async () => {
      const projectId = 'proj-1';
      const now = new Date();
      const pastDate = new Date(now.getTime() - 100000);
      const futureDate = new Date(now.getTime() + 100000);

      const mockIssues = [
        { assigneeId: 'user-1', status: 'TODO', dueDate: pastDate, parentId: null },
        { assigneeId: 'user-1', status: 'IN_PROGRESS', dueDate: futureDate, parentId: null },
        { assigneeId: 'user-2', status: 'DONE', dueDate: pastDate, parentId: null },
      ];

      (mockPrisma.project.findFirst as any).mockResolvedValue({ id: projectId });
      (mockPrisma.issue.findMany as any).mockResolvedValue(mockIssues);

      const workload = await service.getWorkload(projectId, false);

      expect(mockPrisma.issue.findMany).toHaveBeenCalledWith({
        where: { projectId, assigneeId: { not: null }, parentId: null },
        select: { assigneeId: true, status: true, dueDate: true },
      });

      expect(workload['user-1'].totalIssues).toBe(2);
      expect(workload['user-1'].statusBreakdown.TODO).toBe(1);
      expect(workload['user-1'].statusBreakdown.IN_PROGRESS).toBe(1);
      expect(workload['user-1'].overdueCount).toBe(1); // TODO is overdue

      expect(workload['user-2'].totalIssues).toBe(1);
      expect(workload['user-2'].statusBreakdown.DONE).toBe(1);
      expect(workload['user-2'].overdueCount).toBe(0); // DONE is not overdue
    });

    it('should aggregate workload correctly including subtasks', async () => {
      const projectId = 'proj-1';
      const now = new Date();
      const pastDate = new Date(now.getTime() - 100000);

      const mockIssues = [
        { assigneeId: 'user-1', status: 'TODO', dueDate: pastDate, parentId: null },
        { assigneeId: 'user-1', status: 'TODO', dueDate: pastDate, parentId: 'parent-1' },
      ];

      (mockPrisma.project.findFirst as any).mockResolvedValue({ id: projectId });
      (mockPrisma.issue.findMany as any).mockResolvedValue(mockIssues);

      const workload = await service.getWorkload(projectId, true);

      expect(mockPrisma.issue.findMany).toHaveBeenCalledWith({
        where: { projectId, assigneeId: { not: null } },
        select: { assigneeId: true, status: true, dueDate: true },
      });

      expect(workload['user-1'].totalIssues).toBe(2);
      expect(workload['user-1'].statusBreakdown.TODO).toBe(2);
      expect(workload['user-1'].overdueCount).toBe(2);
    });
  });

  });
});