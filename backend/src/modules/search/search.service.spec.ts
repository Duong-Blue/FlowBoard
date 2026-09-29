import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../database/prisma.service';
import { vi } from 'vitest';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            projectMember: {
              findMany: vi.fn(),
            },
            project: {
              findUnique: vi.fn(),
              findMany: vi.fn(),
            },
            issue: {
              findFirst: vi.fn(),
              findMany: vi.fn(),
            },
            user: {
              findMany: vi.fn(),
            },
            $queryRaw: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getAccessibleProjectIds', () => {
    it('should return accessible project IDs', async () => {
      vi.spyOn(prisma.projectMember, 'findMany').mockResolvedValue([
        { projectId: 'proj-1' } as any,
        { projectId: 'proj-2' } as any,
      ]);

      const result = await service.getAccessibleProjectIds('user-1');
      expect(result).toEqual(['proj-1', 'proj-2']);
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { projectId: true },
      });
    });

    it('should filter by orgId if provided', async () => {
      vi.spyOn(prisma.projectMember, 'findMany').mockResolvedValue([
        { projectId: 'proj-1' } as any,
      ]);

      const result = await service.getAccessibleProjectIds('user-1', 'org-1');
      expect(result).toEqual(['proj-1']);
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          project: { organizationId: 'org-1' },
        },
        select: { projectId: true },
      });
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      vi.spyOn(service, 'getAccessibleProjectIds').mockResolvedValue([
        'proj-1',
      ]);
    });

    it('should return empty if no accessible projects', async () => {
      vi.spyOn(service, 'getAccessibleProjectIds').mockResolvedValue([]);
      const result = await service.getSuggestions('user-1', { q: 'test' });
      expect(result).toEqual({
        exactMatch: null,
        issues: [],
        projects: [],
        users: [],
      });
    });

    it('should match exact full key and prioritize target issue', async () => {
      const issue = { id: 'issue-1', key: 'FB-123', projectId: 'proj-1' };
      vi.spyOn(prisma.issue, 'findFirst').mockResolvedValue(issue as any);
      vi.spyOn(prisma.issue, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

      const result = await service.getSuggestions('user-1', { q: 'FB-123' });

      expect(prisma.issue.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'FB-123', projectId: { in: ['proj-1'] } },
        }),
      );
      expect(result.exactMatch?.key).toBe('FB-123');
    });

    it('should handle shorthand key with projectId', async () => {
      const project = { id: 'proj-1', key: 'FB' };
      const issue = { id: 'issue-1', key: 'FB-123', projectId: 'proj-1' };

      vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(project as any);
      vi.spyOn(prisma.issue, 'findFirst').mockResolvedValue(issue as any);
      vi.spyOn(prisma.issue, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

      const result = await service.getSuggestions('user-1', {
        q: '#123',
        projectId: 'proj-1',
      });

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        select: { key: true },
      });
      expect(prisma.issue.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'FB-123', projectId: { in: ['proj-1'] } },
        }),
      );
      expect(result.exactMatch?.key).toBe('FB-123');
    });
  });

  describe('fullSearch users', () => {
    it('should search users only in accessible projects', async () => {
      vi.spyOn(service, 'getAccessibleProjectIds').mockResolvedValue([
        'proj-1',
      ]);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
        { id: 'user-2', displayName: 'Test User' } as any,
      ]);

      const result = await service.fullSearch('user-1', {
        type: 'USER',
        q: 'Test',
      } as any);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectMemberships: { some: { projectId: { in: ['proj-1'] } } },
            OR: [
              { displayName: { contains: 'Test', mode: 'insensitive' } },
              { email: { contains: 'Test', mode: 'insensitive' } },
            ],
          }),
        }),
      );
      expect(result.items.length).toBe(1);
    });
  });
});
