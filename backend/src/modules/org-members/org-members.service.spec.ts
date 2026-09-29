import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OrgMembersService } from './org-members.service';
import { PrismaService } from '../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('OrgMembersService', () => {
  let service: OrgMembersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgMembersService,
        {
          provide: PrismaService,
          useValue: {
            organizationMember: {
              findUnique: vi.fn(),
              findFirst: vi.fn(),
              count: vi.fn(),
              update: vi.fn(),
              delete: vi.fn(),
            },
            projectMember: {
              deleteMany: vi.fn(),
            },
            $transaction: vi.fn(async (cb) => cb(prisma)),
          },
        },
        {
          provide: ActivityService,
          useValue: {
            createActivity: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrgMembersService>(OrgMembersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('updateRole', () => {
    it('fails when target user equals requester', async () => {
      await expect(
        service.updateRole('org1', 'user1', 'user1', 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('fails when removing sole OWNER of organization', async () => {
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: '1',
        organizationId: 'org1',
        userId: 'requester',
        role: 'OWNER',
      } as any);

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        id: '2',
        organizationId: 'org1',
        userId: 'target',
        role: 'OWNER',
      } as any);

      vi.mocked(prisma.organizationMember.count).mockResolvedValue(1);

      await expect(
        service.remove('org1', 'target', 'requester'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
