import { Test, TestingModule } from '@nestjs/testing';
import { OAuthService } from './oauth.service';
import { PrismaService } from '../../../database/prisma.service';
import { AuthService } from '../auth.service';
import { GitHubAdapter } from './adapters/github.adapter';
import { GoogleAdapter } from './adapters/google.adapter';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('OAuthService', () => {
  let service: OAuthService;
  let prismaService: any;
  let authService: any;
  let githubAdapter: any;

  beforeEach(async () => {
    prismaService = {
      oAuthFlow: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      oAuthExchangeCode: {
        create: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prismaService)),
    };

    authService = {
      issueSessionTokens: vi.fn(),
    };

    githubAdapter = {
      getAuthorizationUrl: vi.fn().mockReturnValue('http://github'),
      exchangeCode: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuthService, useValue: authService },
        {
          provide: GitHubAdapter,
          useValue: githubAdapter, // Use the outer githubAdapter
        },
        {
          provide: GoogleAdapter,
          useValue: {
            getAuthorizationUrl: vi.fn().mockReturnValue('http://google'),
            exchangeCode: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('beginFlow', () => {
    it('should create an OAuthFlow and return url', async () => {
      const result = await service.beginFlow('github', '/workspace');
      expect(result.url).toBe('http://github');
      expect(prismaService.oAuthFlow.create).toHaveBeenCalled();
    });

    it('should reject invalid providers', async () => {
      await expect(service.beginFlow('invalid')).rejects.toThrow(
        'Unsupported OAuth provider',
      );
    });
  });

  describe('handleCallback', () => {
    it('should return error if state is missing or expired', async () => {
      prismaService.oAuthFlow.findUnique.mockResolvedValue(null);
      const res = await service.handleCallback('github', 'code', 'state');
      expect(res.error).toBe('invalid_state');
    });

    it('should auto-link OAuth provider to existing user with same email', async () => {
      prismaService.oAuthFlow.findUnique.mockResolvedValue({
        id: 'flow-1',
        provider: 'GITHUB',
        codeVerifier: 'verifier',
        returnTo: '/workspace',
        expiresAt: new Date(Date.now() + 60000),
        consumedAt: null,
      });
      prismaService.oAuthFlow.update.mockResolvedValue({ id: 'flow-1' });

      githubAdapter.exchangeCode = vi.fn().mockResolvedValue({
        id: 'github-123',
        email: 'existing@example.com',
      });

      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'existing@example.com',
      });
      prismaService.user.update.mockResolvedValue({ id: 'user-1' });
      prismaService.oAuthExchangeCode.create.mockResolvedValue({});

      const res = await service.handleCallback('github', 'code', 'state');
      expect(res.code).toBeDefined();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          oauthAccounts: {
            create: {
              provider: 'GITHUB',
              providerAccountId: 'github-123',
              providerEmail: 'existing@example.com',
            },
          },
        },
      });
    });
  });
});
