import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SavedViewsService } from './saved-views.service';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('SavedViewsService', () => {
  let service: SavedViewsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService;

  const mockPrismaService = {
    savedView: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedViewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SavedViewsService>(SavedViewsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a private view', async () => {
      mockPrismaService.savedView.create.mockResolvedValue({ id: 'v1' });
      const result = await service.create('p1', 'u1', ProjectRole.MEMBER, {
        name: 'My View',
        filterJson: { status: 'OPEN' },
        isShared: false,
      });
      expect(result).toEqual({ id: 'v1' });
      expect(mockPrismaService.savedView.create).toHaveBeenCalled();
    });

    it('should fail to create a shared view if not admin', async () => {
      await expect(
        service.create('p1', 'u1', ProjectRole.MEMBER, {
          name: 'Shared View',
          filterJson: {},
          isShared: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a shared view if admin', async () => {
      mockPrismaService.savedView.create.mockResolvedValue({ id: 'v1' });
      await service.create('p1', 'u1', ProjectRole.ADMIN, {
        name: 'Shared View',
        filterJson: {},
        isShared: true,
      });
      expect(mockPrismaService.savedView.create).toHaveBeenCalled();
    });

    it('should fail if filterJson is too deeply nested', async () => {
      const deepJson = { a: { b: { c: { d: { e: { f: 1 } } } } } }; // Depth 6
      await expect(
        service.create('p1', 'u1', ProjectRole.ADMIN, {
          name: 'View',
          filterJson: deepJson,
          isShared: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return shared views and own private views', async () => {
      mockPrismaService.savedView.findMany.mockResolvedValue([]);
      await service.findAll('p1', 'u1');
      expect(mockPrismaService.savedView.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'p1',
          OR: [{ isShared: true }, { createdById: 'u1' }],
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a private view if owner', async () => {
      mockPrismaService.savedView.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        isShared: false,
        createdById: 'u1',
      });
      const result = await service.findOne('p1', 'v1', 'u1');
      expect(result.id).toEqual('v1');
    });

    it('should fail to return a private view if not owner', async () => {
      mockPrismaService.savedView.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        isShared: false,
        createdById: 'u2',
      });
      await expect(service.findOne('p1', 'v1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should fail if not admin updating shared view', async () => {
      mockPrismaService.savedView.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        isShared: true,
        createdById: 'u1',
      });
      await expect(
        service.update('p1', 'v1', 'u1', ProjectRole.MEMBER, { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update private view if owner', async () => {
      mockPrismaService.savedView.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        isShared: false,
        createdById: 'u1',
      });
      mockPrismaService.savedView.update.mockResolvedValue({ id: 'v1' });
      await service.update('p1', 'v1', 'u1', ProjectRole.MEMBER, { name: 'New' });
      expect(mockPrismaService.savedView.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove private view if owner', async () => {
      mockPrismaService.savedView.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        isShared: false,
        createdById: 'u1',
      });
      mockPrismaService.savedView.delete.mockResolvedValue({ id: 'v1' });
      await service.remove('p1', 'v1', 'u1', ProjectRole.MEMBER);
      expect(mockPrismaService.savedView.delete).toHaveBeenCalled();
    });

    it('should fail if member tries to remove shared view', async () => {
      mockPrismaService.savedView.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        isShared: true,
        createdById: 'u1',
      });
      await expect(service.remove('p1', 'v1', 'u1', ProjectRole.MEMBER)).rejects.toThrow(ForbiddenException);
    });
  });
});
