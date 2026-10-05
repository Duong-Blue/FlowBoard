import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { vi } from 'vitest';
import * as crypto from 'crypto';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    $transaction: vi.fn((cb) =>
      Array.isArray(cb) ? Promise.all(cb) : cb(mockPrisma),
    ),
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hash',
        oauthAccounts: [{ provider: 'github' }],
      }),
      create: vi.fn().mockResolvedValue({ id: '1' }),
      update: vi.fn().mockResolvedValue({ id: '1' }),
      delete: vi.fn().mockResolvedValue({ id: '1' }),
    },
    refreshToken: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ familyId: 'f1' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    organizationMember: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    projectMember: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const mockStorage = {
    saveFile: vi.fn().mockResolvedValue(undefined),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    getFileStream: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LocalStorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns profile with hasPassword and oauthProviders', async () => {
      const profile = await service.getProfile('1');
      expect(profile.hasPassword).toBe(true);
      expect(profile.oauthProviders).toEqual(['github']);
    });
  });

  describe('updateProfile', () => {
    it('normalizes empty strings for bio/displayName', async () => {
      await service.updateProfile('1', { displayName: '', bio: '' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { displayName: null, bio: null },
        include: { oauthAccounts: true },
      });
    });

    it('preserves non-null firstName/lastName', async () => {
      await service.updateProfile('1', { firstName: 'John', lastName: 'Doe' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { firstName: 'John', lastName: 'Doe' },
        include: { oauthAccounts: true },
      });
    });
  });

  describe('uploadAvatar & deleteAvatar', () => {
    it('handles storage operations and URL formatting on upload', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        avatarUrl: null,
      });
      // mockPrisma.user.update is already set up to resolve

      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      } as any;
      await service.uploadAvatar('1', file);

      expect(mockStorage.saveFile).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: {
            avatarUrl: expect.stringContaining(
              '/api/users/me/avatar/download?path=avatars%2F1%2F',
            ),
          },
        }),
      );
    });

    it('deletes old avatar from storage on deleteAvatar', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        avatarUrl: '/api/users/me/avatar/download?path=old/path.jpg',
      });
      // mockPrisma.user.update is already set up to resolve

      await service.deleteAvatar('1');

      expect(mockStorage.deleteFile).toHaveBeenCalledWith('old/path.jpg');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { avatarUrl: null },
        }),
      );
    });
  });

  describe('changePassword', () => {
    it('verifies current password, updates hash, deletes refresh tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: 'old_hash',
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await service.changePassword('1', {
        currentPassword: 'old',
        newPassword: 'new',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('old', 'old_hash');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { passwordHash: 'hashed_password' },
      });
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: '1' },
      });
    });
  });

  describe('setPassword', () => {
    it('prevents setting if password already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: 'exists',
      });
      await expect(
        service.setPassword('1', { newPassword: 'new' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Sessions', () => {
    it('getSessions groups by familyId and marks isCurrent', async () => {
      const tokenHash = crypto
        .createHash('sha256')
        .update('refresh')
        .digest('hex');
      const activeTokens = [
        {
          familyId: 'f1',
          createdAt: new Date('2023-01-01'),
          expiresAt: new Date('2023-01-10'),
          tokenHash: 'hash1',
        },
        {
          familyId: 'f1',
          createdAt: new Date('2023-01-02'),
          expiresAt: new Date('2023-01-11'),
          tokenHash,
        },
      ];
      mockPrisma.refreshToken.findMany.mockResolvedValue(activeTokens);

      const sessions = await service.getSessions('1', 'refresh');
      expect(sessions.length).toBe(1);
      expect(sessions[0].familyId).toBe('f1');
      expect(sessions[0].isCurrent).toBe(true);
      expect(sessions[0].lastUsedAt).toEqual(activeTokens[1].createdAt);
    });

    it('deleteSession revokes tokens', async () => {
      mockPrisma.refreshToken.findMany.mockResolvedValue([{ id: 't1' }]);
      await service.deleteSession('1', 'f1');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: '1', familyId: 'f1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('deleteAllOtherSessions revokes other tokens', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({ familyId: 'f1' });
      await service.deleteAllOtherSessions('1', 'refresh');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: '1', familyId: { not: 'f1' }, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('deleteAccount', () => {
    it('checks sole-owner org blocking', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: null,
      });
      mockPrisma.organizationMember.findMany.mockResolvedValue([
        { organizationId: 'o1', role: 'OWNER' },
      ]);
      mockPrisma.organizationMember.count.mockResolvedValue(1);

      await expect(
        service.deleteAccount('1', { confirmation: 'DELETE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires correct confirmation if no password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: null,
      });
      await expect(
        service.deleteAccount('1', { confirmation: 'wrong' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires password if password is set', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: 'hash',
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      mockPrisma.organizationMember.findMany.mockResolvedValue([]);

      await service.deleteAccount('1', { password: 'pass' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
