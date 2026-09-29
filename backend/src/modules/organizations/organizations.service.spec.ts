import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const mockPrisma = {
    $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    organization: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organizationMember: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    vi.clearAllMocks();
  });

  it('create: should create org and owner member', async () => {
    mockPrisma.organization.create.mockResolvedValue({ id: 'org1' });
    mockPrisma.organization.findUnique.mockResolvedValue(null);
    await service.create('u1', { name: 'test' });
    expect(mockPrisma.organization.create).toHaveBeenCalled();
    expect(mockPrisma.organizationMember.create).toHaveBeenCalledWith({
      data: { organizationId: 'org1', userId: 'u1', role: 'OWNER' },
    });
  });

  it('findAllForUser: should return orgs', async () => {
    mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org1' }]);
    const res = await service.findAllForUser('u1');
    expect(res).toHaveLength(1);
  });

  describe('update', () => {
    it('rejects MEMBER role', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org1' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        organizationId: 'org1',
        userId: 'u1',
        role: 'MEMBER',
      });

      await expect(
        service.update('org1', 'u1', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('rejects ADMIN or MEMBER role', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org1' });

      // ADMIN
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        organizationId: 'org1',
        userId: 'u1',
        role: 'ADMIN',
      });

      await expect(service.delete('org1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );

      // MEMBER
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        organizationId: 'org1',
        userId: 'u1',
        role: 'MEMBER',
      });

      await expect(service.delete('org1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
