import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GoogleAdapter } from '../src/modules/auth/oauth/adapters/google.adapter';
import { GitHubAdapter } from '../src/modules/auth/oauth/adapters/github.adapter';
import { PrismaService } from '../src/database/prisma.service';
import { vitest, describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';

const mockGoogleAdapter = {
  getAuthorizationUrl: vitest.fn(),
  exchangeCode: vitest.fn(),
};

const mockGitHubAdapter = {
  getAuthorizationUrl: vitest.fn(),
  exchangeCode: vitest.fn(),
};

describe('OAuth Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleAdapter)
      .useValue(mockGoogleAdapter)
      .overrideProvider(GitHubAdapter)
      .useValue(mockGitHubAdapter)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vitest.clearAllMocks();
  });

  describe('Google OAuth', () => {
    let testState: string;
    let flowBoardCode: string;

    it('/auth/oauth/google (GET) - begin flow & valid redirect', async () => {
      mockGoogleAdapter.getAuthorizationUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?client_id=123');

      const response = await request(app.getHttpServer())
        .get('/auth/oauth/google?returnTo=/dashboard')
        .expect(302);

      expect(response.header.location).toBe('https://accounts.google.com/o/oauth2/v2/auth?client_id=123');

      expect(mockGoogleAdapter.getAuthorizationUrl).toHaveBeenCalled();
      testState = mockGoogleAdapter.getAuthorizationUrl.mock.calls[0][0];
    });

    it('/auth/oauth/google/callback (GET) - successful callback creates user', async () => {
      mockGoogleAdapter.exchangeCode.mockResolvedValue({
        id: 'google-123',
        email: 'test.google@example.com',
        firstName: 'Google',
        lastName: 'User',
        isEmailVerified: true,
      });

      const response = await request(app.getHttpServer())
        .get(`/auth/oauth/google/callback?code=mock-google-code&state=${testState}`)
        .expect(302);

      const location = response.header.location;
      expect(location).toMatch(/http:\/\/localhost:5173\/oauth\/callback\?code=.+/);
      
      const url = new URL(location);
      flowBoardCode = url.searchParams.get('code') as string;
      expect(flowBoardCode).toBeDefined();

      const user = await prisma.user.findUnique({
        where: { email: 'test.google@example.com' },
        include: { oauthAccounts: true },
      });
      expect(user).toBeDefined();
      expect(user?.oauthAccounts[0].provider).toBe('GOOGLE');
      expect(user?.oauthAccounts[0].providerAccountId).toBe('google-123');
    });

    it('/auth/oauth/exchange (POST) - exchanges valid code for JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code: flowBoardCode })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test.google@example.com');
    });

    it('/auth/oauth/google/callback (GET) - prevents replay with consumed state', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auth/oauth/google/callback?code=mock-google-code&state=${testState}`)
        .expect(302);

      const location = response.header.location;
      expect(location).toMatch(/http:\/\/localhost:5173\/oauth\/callback\?error=invalid_state/);
    });
  });

  describe('GitHub OAuth & Security', () => {
    let testState: string;

    beforeEach(async () => {
      mockGitHubAdapter.getAuthorizationUrl.mockReturnValue('https://github.com/login/oauth/authorize?client_id=123');
      await request(app.getHttpServer())
        .get('/auth/oauth/github?returnTo=https://evil.com')
        .expect(302);

      testState = mockGitHubAdapter.getAuthorizationUrl.mock.calls[0][0];
    });

    it('rejects unverified email', async () => {
      mockGitHubAdapter.exchangeCode.mockRejectedValue(new Error('GitHub account does not have a primary, verified email'));

      const response = await request(app.getHttpServer())
        .get(`/auth/oauth/github/callback?code=mock-github-code&state=${testState}`)
        .expect(302);

      expect(response.header.location).toMatch(/http:\/\/localhost:5173\/oauth\/callback\?error=exchange_failed/);
    });

    it('handles account conflict (password user logging in with OAuth)', async () => {
      await prisma.user.deleteMany({ where: { email: 'conflict@example.com' } });

      await prisma.user.create({
        data: {
          email: 'conflict@example.com',
          passwordHash: 'hashed-password',
          firstName: 'Conflict',
          lastName: 'User',
        },
      });

      mockGitHubAdapter.exchangeCode.mockResolvedValue({
        id: 'github-789',
        email: 'conflict@example.com',
        firstName: 'Github',
        lastName: 'User',
        isEmailVerified: true,
      });

      const response = await request(app.getHttpServer())
        .get(`/auth/oauth/github/callback?code=mock-github-code&state=${testState}`)
        .expect(302);

      expect(response.header.location).toMatch(/http:\/\/localhost:5173\/oauth\/callback\?error=account_conflict/);
    });

    it('sanitizes open redirect (returnTo=https://evil.com) to /workspace on exchange', async () => {
      mockGitHubAdapter.exchangeCode.mockResolvedValue({
        id: 'github-999',
        email: 'secure.redirect@example.com',
        firstName: 'Secure',
        lastName: 'User',
        isEmailVerified: true,
      });

      const response = await request(app.getHttpServer())
        .get(`/auth/oauth/github/callback?code=mock-github-code&state=${testState}`)
        .expect(302);

      const location = response.header.location;
      const url = new URL(location);
      const code = url.searchParams.get('code');

      const exchangeResponse = await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code })
        .expect(201);

      expect(exchangeResponse.body.returnTo).toBe('/workspace');
    });
  });
});
