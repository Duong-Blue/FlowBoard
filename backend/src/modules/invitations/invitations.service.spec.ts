import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';
import {
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: NotificationsService,
          useValue: { createNotification: vi.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            organizationMember: {
              findUnique: vi.fn(),
              findFirst: vi.fn(),
              create: vi.fn(),
            },
            invitation: {
              findFirst: vi.fn(),
              findMany: vi.fn(),
              create: vi.fn(),
              findUnique: vi.fn(),
              update: vi.fn(),
            },
            user: {
              findUnique: vi.fn(),
              findFirst: vi.fn(),
            },
            organization: {
              findFirst: vi.fn(),
              findUnique: vi.fn(),
            },
            $transaction: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('fails when requester is MEMBER', async () => {
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: '1',
        organizationId: 'org1',
        userId: 'user1',
        role: 'MEMBER',
        user: { email: 'requester@test.com' },
      } as any);

      await expect(
        service.create('org1', 'user1', {
          email: 'test@test.com',
          role: 'ADMIN',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('fails when requesting role OWNER', async () => {
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: '1',
        organizationId: 'org1',
        userId: 'user1',
        role: 'OWNER',
        user: { email: 'requester@test.com' },
      } as any);

      await expect(
        service.create('org1', 'user1', {
          email: 'test@test.com',
          role: 'OWNER',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('fails when self-inviting', async () => {
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: '1',
        organizationId: 'org1',
        userId: 'user1',
        role: 'OWNER',
        user: { email: 'requester@test.com' },
      } as any);

      await expect(
        service.create('org1', 'user1', {
          email: 'requester@test.com',
          role: 'ADMIN',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('accept', () => {
    it('handles Prisma P2002 constraint error idempotently', async () => {
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue({
        id: 'inv1',
        organizationId: 'org1',
        role: 'MEMBER',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user2',
        email: 'test@test.com',
      } as any);

      const p2002Error = new Error('Prisma error');
      (p2002Error as any).code = 'P2002';

      vi.mocked(prisma.$transaction).mockRejectedValue(p2002Error);

      const existingMember = {
        id: 'mem1',
        organizationId: 'org1',
        userId: 'user2',
        role: 'MEMBER',
      };
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue(
        existingMember as any,
      );
      vi.mocked(prisma.invitation.update).mockResolvedValue({} as any);

      const result = await service.accept('dummy_token', 'user2');

      expect(result).toEqual(existingMember);
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { acceptedAt: expect.any(Date) },
      });
    });
  });

  describe('decline', () => {
    it('successfully marks declinedAt when token and email match', async () => {
      const invitation = {
        id: 'inv1',
        organizationId: 'org1',
        email: 'test@test.com',
      };
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue(
        invitation as any,
      );
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user2',
        email: 'test@test.com',
      } as any);

      const updatedInv = { ...invitation, declinedAt: new Date() };
      vi.mocked(prisma.invitation.update).mockResolvedValue(updatedInv as any);

      const result = await service.decline('dummy_token', 'user2');

      expect(result).toEqual(updatedInv);
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { declinedAt: expect.any(Date) },
      });
    });

    it('fails when user email does not match invitation email', async () => {
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue({
        id: 'inv1',
        organizationId: 'org1',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user2',
        email: 'different@test.com',
      } as any);

      await expect(service.decline('dummy_token', 'user2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findPendingForUser', () => {
    it('verifies expired or declined invitations are excluded in Prisma query', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user1',
        email: 'user@example.com',
      } as any);
      vi.mocked(prisma.invitation.findMany).mockResolvedValue([]);

      await service.findPendingForUser('user1');

      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: {
          email: { equals: 'user@example.com', mode: 'insensitive' },
          acceptedAt: null,
          revokedAt: null,
          declinedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          invitedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('returns empty array if user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      await expect(
        service.findPendingForUser('nonexistentUser'),
      ).resolves.toEqual([]);
      expect(prisma.invitation.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findPending', () => {
    it('fails when requester is not OWNER or ADMIN', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        id: '1',
        organizationId: 'org1',
        userId: 'user1',
        role: 'MEMBER',
      } as any);

      await expect(service.findPending('org1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns pending invitations when requester is ADMIN', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        id: '1',
        organizationId: 'org1',
        userId: 'user1',
        role: 'ADMIN',
      } as any);
      vi.mocked(prisma.invitation.findMany).mockResolvedValue([
        { id: 'inv1', organizationId: 'org1' },
      ] as any);

      const result = await service.findPending('org1', 'user1');
      expect(result).toHaveLength(1);
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org1',
          acceptedAt: null,
          revokedAt: null,
          declinedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        include: {
          invitedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});
