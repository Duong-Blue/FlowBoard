import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  hashSync: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let prisma: PrismaService;

  beforeEach(() => {
    usersService = {
      findOne: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateRefreshToken: vi.fn(),
      findByRefreshTokenHash: vi.fn(),
      clearRefreshToken: vi.fn(),
      updateLastLogin: vi.fn(),
    } as any;
    jwtService = { sign: vi.fn().mockReturnValue('mock-token') } as any;
    prisma = {
      $transaction: vi.fn().mockImplementation(async (cb) => {
        return cb(prisma);
      }),
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    } as any;
    authService = new AuthService(usersService, jwtService, prisma);
  });

  it('should register a new user', async () => {
    vi.mocked(usersService.findByEmail).mockResolvedValue(null);
    const mockUser = {
      id: 1,
      email: 'test@example.com',
    } as any;
    vi.mocked(usersService.create).mockResolvedValue(mockUser);
    vi.mocked(usersService.findById).mockResolvedValue(mockUser);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);

    const result = await authService.register({
      email: 'test@example.com',
      password: 'password',
      name: 'Test',
    } as any);
    expect(result).toBeDefined();
    expect(usersService.create).toHaveBeenCalled();
  });

  it('should login valid user', async () => {
    const passwordHash = 'password123';
    const user = {
      id: 1,
      email: 'test@example.com',
      passwordHash,
      isActive: true,
    };
    vi.mocked(usersService.findByEmail).mockResolvedValue(user as any);
    vi.mocked(usersService.findById).mockResolvedValue(user as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('should throw UnauthorizedException if token does not exist', async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null);
    await expect(authService.refresh('invalid-token')).rejects.toThrow(
      'Invalid refresh token',
    );
  });

  it('should throw UnauthorizedException if token is expired', async () => {
    const mockToken = {
      id: 'token-id-123',
      familyId: 'family-123',
      userId: 1,
      revokedAt: null,
      replacedByToken: null,
      expiresAt: new Date(Date.now() - 10000), // expired
      user: { id: 1 },
    };
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(
      mockToken as any,
    );

    await expect(authService.refresh('expired-token')).rejects.toThrow(
      'Invalid refresh token',
    );
  });

  it('should detect reuse and revoke family', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };
    const mockToken = {
      id: 'token-id-123',
      familyId: 'family-123',
      userId: 1,
      revokedAt: new Date(),
      replacedByToken: 'another-token',
      expiresAt: new Date(Date.now() + 100000),
      user: mockUser,
    };

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(
      mockToken as any,
    );

    await expect(authService.refresh('some-token')).rejects.toThrow(
      'Refresh token reuse detected',
    );

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-123' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('should successfully refresh and rotate token', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };
    const mockToken = {
      id: 'token-id-123',
      familyId: 'family-123',
      userId: 1,
      revokedAt: null,
      replacedByToken: null,
      expiresAt: new Date(Date.now() + 100000),
      user: mockUser,
    };

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(
      mockToken as any,
    );
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({
      id: 'new-token-id',
    } as any);

    const result = await authService.refresh('some-token');

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');

    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          familyId: 'family-123',
          userId: 1,
        }),
      }),
    );

    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'token-id-123' },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
          replacedByToken: 'new-token-id',
        }),
      }),
    );
  });
});
