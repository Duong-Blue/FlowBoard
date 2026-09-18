import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let _prisma: PrismaService;

  const mockPrisma = {
    project: {
      findFirst: vi.fn(),
    },
    issue: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
    issueActivity: {
      create: vi.fn(),
    },
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
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    _prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('throws NotFoundException if issue not in project', async () => {
      mockPrisma.issue.findUnique.mockResolvedValueOnce({ projectId: 'wrong' });
      await expect(service.findAll('proj1', 'issue1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns paginated comments', async () => {
      mockPrisma.issue.findUnique.mockResolvedValueOnce({ projectId: 'proj1' });
      mockPrisma.comment.findMany.mockResolvedValueOnce([{ id: 'c1' }]);
      mockPrisma.comment.count.mockResolvedValueOnce(1);

      const result = await service.findAll('proj1', 'issue1', { page: 1, limit: 10 });
      expect(result).toEqual({
        items: [{ id: 'c1' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { issueId: 'issue1' },
        skip: 0,
        take: 10,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { author: { select: expect.any(Object) } },
      });
    });
  });

  describe('create', () => {
    it('creates comment and activity', async () => {
      mockPrisma.issue.findUnique.mockResolvedValueOnce({ projectId: 'proj1' });
      mockPrisma.comment.create.mockResolvedValueOnce({ id: 'c1', content: 'test' });

      const result = await service.create('proj1', 'issue1', 'user1', { content: 'test' });
      expect(result).toEqual({ id: 'c1', content: 'test' });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(expect.any(Object));
      expect(mockPrisma.issueActivity.create).toHaveBeenCalledWith({
        data: {
          issueId: 'issue1',
          actorId: 'user1',
          type: 'COMMENT_CREATED',
          metadata: { commentId: 'c1', snippet: 'test' },
        },
      });
    });
  });

  describe('update', () => {
    it('throws ForbiddenException if not author and not ADMIN', async () => {
      mockPrisma.issue.findUnique.mockResolvedValueOnce({ projectId: 'proj1' });
      mockPrisma.comment.findUnique.mockResolvedValueOnce({ issueId: 'issue1', authorId: 'user1' });

      await expect(
        service.update('proj1', 'issue1', 'c1', 'user2', ProjectRole.MEMBER, { content: 'new' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows ADMIN to update other user comment', async () => {
      mockPrisma.issue.findUnique.mockResolvedValueOnce({ projectId: 'proj1' });
      mockPrisma.comment.findUnique.mockResolvedValueOnce({ issueId: 'issue1', authorId: 'user1' });
      mockPrisma.comment.update.mockResolvedValueOnce({ id: 'c1', content: 'new' });

      const result = await service.update('proj1', 'issue1', 'c1', 'admin1', ProjectRole.ADMIN, { content: 'new' });
      expect(result).toEqual({ id: 'c1', content: 'new' });
      expect(mockPrisma.comment.update).toHaveBeenCalled();
      expect(mockPrisma.issueActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'COMMENT_UPDATED' }) }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException if comment not found', async () => {
      mockPrisma.issue.findUnique.mockResolvedValueOnce({ projectId: 'proj1' });
      mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.remove('proj1', 'issue1', 'c1', 'user1', ProjectRole.MEMBER),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes comment if author', async () => {
      mockPrisma.issue.findUnique.mockResolvedValueOnce({ projectId: 'proj1' });
      mockPrisma.comment.findUnique.mockResolvedValueOnce({ issueId: 'issue1', authorId: 'user1' });

      const result = await service.remove('proj1', 'issue1', 'c1', 'user1', ProjectRole.MEMBER);
      expect(result).toEqual({ success: true });
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(mockPrisma.issueActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'COMMENT_DELETED' }) }),
      );
    });
  });
});
