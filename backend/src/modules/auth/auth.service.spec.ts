import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
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
      create: vi.fn(),
      updateRefreshToken: vi.fn(),
      findByRefreshTokenHash: vi.fn(),
      clearRefreshToken: vi.fn(),
      updateLastLogin: vi.fn(),
    } as any;
    jwtService = { sign: vi.fn().mockReturnValue('mock-token') } as any;
    prisma = {
      refreshToken: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    } as any;
    authService = new AuthService(usersService, jwtService, prisma);
  });

  it('should register a new user', async () => {
    vi.mocked(usersService.findByEmail).mockResolvedValue(null);
    vi.mocked(usersService.create).mockResolvedValue({ id: 1, email: 'test@example.com' } as any);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);

    const result = await authService.register({ email: 'test@example.com', password: 'password', name: 'Test' });
    expect(result).toBeDefined();
    expect(usersService.create).toHaveBeenCalled();
  });

  it('should login valid user', async () => {
    const passwordHash = bcrypt.hashSync('password123', 10);
    const user = { id: 1, email: 'test@example.com', passwordHash, isActive: true };
    vi.mocked(usersService.findByEmail).mockResolvedValue(user as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);
    
    const result = await authService.login({ email: 'test@example.com', password: 'password123' });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
