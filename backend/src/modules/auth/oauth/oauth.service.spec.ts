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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuthService, useValue: authService },
        {
          provide: GitHubAdapter,
          useValue: {
            getAuthorizationUrl: vi.fn().mockReturnValue('http://github'),
            exchangeCode: vi.fn(),
          },
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
      await expect(service.beginFlow('invalid')).rejects.toThrow('Unsupported OAuth provider');
    });
  });

  describe('handleCallback', () => {
    it('should return error if state is missing or expired', async () => {
      prismaService.oAuthFlow.findUnique.mockResolvedValue(null);
      const res = await service.handleCallback('github', 'code', 'state');
      expect(res.error).toBe('invalid_state');
    });
  });
});
