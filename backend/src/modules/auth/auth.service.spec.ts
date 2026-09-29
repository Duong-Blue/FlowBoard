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
  let mailerService: any;

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
      user: { update: vi.fn() },
      passwordResetCode: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    } as any;
    mailerService = { sendPasswordResetCode: vi.fn() };
    authService = new AuthService(
      usersService,
      jwtService,
      prisma,
      mailerService,
    );
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
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
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

  describe('Password Reset Lifecycle', () => {
    it('forgotPassword - unknown email returns generic response', async () => {
      vi.mocked(usersService.findByEmail).mockResolvedValue(null);
      const res = await authService.forgotPassword('unknown@example.com');
      expect(res.message).toBe(
        'If an account exists, a password reset code will be sent to the email.',
      );
      expect(mailerService.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('forgotPassword - known email creates challenge and sends email', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(usersService.findByEmail).mockResolvedValue(mockUser as any);

      const res = await authService.forgotPassword('test@example.com');
      expect(res.message).toBe(
        'If an account exists, a password reset code will be sent to the email.',
      );
      expect(prisma.passwordResetCode.create).toHaveBeenCalled();
      expect(mailerService.sendPasswordResetCode).toHaveBeenCalled();
    });

    it('forgotPassword - OAuth-only user (passwordHash: null) can request password reset without exposing account type', async () => {
      const mockOAuthUser = {
        id: 2,
        email: 'oauth@example.com',
        passwordHash: null,
      };
      vi.mocked(usersService.findByEmail).mockResolvedValue(
        mockOAuthUser as any,
      );

      const res = await authService.forgotPassword('oauth@example.com');
      expect(res.message).toBe(
        'If an account exists, a password reset code will be sent to the email.',
      );
      expect(prisma.passwordResetCode.create).toHaveBeenCalled();
      expect(mailerService.sendPasswordResetCode).toHaveBeenCalled();
    });

    it('verifyResetCode - verification with correct code generates reset token', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(usersService.findByEmail).mockResolvedValue(mockUser as any);

      const { createHash } = require('crypto');
      const code = '123456';
      const codeHash = createHash('sha256').update(code).digest('hex');

      vi.mocked(prisma.passwordResetCode.findFirst).mockResolvedValue({
        id: 'reset-id',
        userId: mockUser.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        consumedAt: null,
      } as any);

      const res = await authService.verifyResetCode('test@example.com', code);
      expect(res.resetToken).toBeDefined();
      expect(prisma.passwordResetCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reset-id' },
          data: expect.objectContaining({ attempts: 0 }),
        }),
      );
    });

    it('verifyResetCode - verification with wrong code increments attempts and fails', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(usersService.findByEmail).mockResolvedValue(mockUser as any);

      vi.mocked(prisma.passwordResetCode.findFirst).mockResolvedValue({
        id: 'reset-id',
        userId: mockUser.id,
        codeHash: 'wrong-hash',
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        consumedAt: null,
      } as any);

      await expect(
        authService.verifyResetCode('test@example.com', '111111'),
      ).rejects.toThrow('Invalid or expired reset code');
      expect(prisma.passwordResetCode.update).toHaveBeenCalledWith({
        where: { id: 'reset-id' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('verifyResetCode - verification of expired code fails', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(usersService.findByEmail).mockResolvedValue(mockUser as any);

      vi.mocked(prisma.passwordResetCode.findFirst).mockResolvedValue({
        id: 'reset-id',
        userId: mockUser.id,
        codeHash: 'hash',
        expiresAt: new Date(Date.now() - 10000),
        attempts: 0,
        consumedAt: null,
      } as any);

      await expect(
        authService.verifyResetCode('test@example.com', '123456'),
      ).rejects.toThrow('Invalid or expired reset code');
    });

    it('verifyResetCode - verification fails at 5 attempts', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(usersService.findByEmail).mockResolvedValue(mockUser as any);

      vi.mocked(prisma.passwordResetCode.findFirst).mockResolvedValue({
        id: 'reset-id',
        userId: mockUser.id,
        codeHash: 'hash',
        expiresAt: new Date(Date.now() + 10000),
        attempts: 5,
        consumedAt: null,
      } as any);

      await expect(
        authService.verifyResetCode('test@example.com', '123456'),
      ).rejects.toThrow('Too many attempts');
    });

    it('resetPassword - with valid token updates password hash, consumes challenge, revokes refresh tokens', async () => {
      const { createHash } = require('crypto');
      const token = 'valid-token';
      const tokenHash = createHash('sha256').update(token).digest('hex');

      vi.mocked(prisma.passwordResetCode.findUnique).mockResolvedValue({
        id: 'reset-id',
        userId: 1,
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: new Date(Date.now() + 10000),
        consumedAt: null,
      } as any);

      vi.mocked(bcrypt.hash).mockResolvedValue('new-password-hash' as any);

      const res = await authService.resetPassword(token, 'newPassword123');
      expect(res.message).toBe('Password updated successfully');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { passwordHash: 'new-password-hash' },
      });
      expect(prisma.passwordResetCode.update).toHaveBeenCalledWith({
        where: { id: 'reset-id' },
        data: { consumedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('resetPassword - OAuth-only user establishes password hash successfully', async () => {
      const { createHash } = require('crypto');
      const token = 'oauth-valid-token';
      const tokenHash = createHash('sha256').update(token).digest('hex');

      vi.mocked(prisma.passwordResetCode.findUnique).mockResolvedValue({
        id: 'reset-id-oauth',
        userId: 2,
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: new Date(Date.now() + 10000),
        consumedAt: null,
      } as any);

      vi.mocked(bcrypt.hash).mockResolvedValue(
        'oauth-new-password-hash' as any,
      );

      const res = await authService.resetPassword(token, 'newOAuthPassword123');
      expect(res.message).toBe('Password updated successfully');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { passwordHash: 'oauth-new-password-hash' },
      });
    });

    it('resetPassword - with consumed/invalid token fails', async () => {
      vi.mocked(prisma.passwordResetCode.findUnique).mockResolvedValue({
        id: 'reset-id',
        userId: 1,
        resetTokenHash: 'hash',
        resetTokenExpiresAt: new Date(Date.now() + 10000),
        consumedAt: new Date(),
      } as any);

      await expect(
        authService.resetPassword('token', 'newPassword123'),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('cleanExpiredResetCodes - deletes expired or old consumed codes', async () => {
      vi.mocked(prisma.passwordResetCode.deleteMany).mockResolvedValue({
        count: 5,
      } as any);

      const count = await authService.cleanExpiredResetCodes();

      expect(count).toBe(5);
      expect(prisma.passwordResetCode.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { consumedAt: { lt: expect.any(Date) } },
          ],
        },
      });
    });
  });
});
