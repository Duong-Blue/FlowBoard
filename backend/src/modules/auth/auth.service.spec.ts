import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(() => {
    usersService = {
      findOne: vi.fn(),
      create: vi.fn(),
      updateRefreshToken: vi.fn(),
      findByRefreshTokenHash: vi.fn(),
      clearRefreshToken: vi.fn(),
    } as any;
    jwtService = { sign: vi.fn().mockReturnValue('mock-token') } as any;
    authService = new AuthService(usersService, jwtService);
  });

  it('should register a new user', async () => {
    vi.mocked(usersService.findOne).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-pass');
    vi.mocked(usersService.create).mockResolvedValue({ id: 1, email: 'test@example.com' });

    const result = await authService.register({ email: 'test@example.com', password: 'password', name: 'Test' });
    expect(result).toBeDefined();
    expect(usersService.create).toHaveBeenCalled();
  });

  it('should login valid user', async () => {
    const user = { id: 1, email: 'test@example.com', passwordHash: 'hashed', isActive: true };
    vi.mocked(usersService.findOne).mockResolvedValue(user);
    vi.mocked(bcrypt.compare).mockResolvedValue(true);
    
    const result = await authService.login({ email: 'test@example.com', password: 'password' });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
