import { Test, TestingModule } from '@nestjs/testing';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('OAuthController', () => {
  let controller: OAuthController;
  let oauthService: any;

  beforeEach(async () => {
    oauthService = {
      beginFlow: vi.fn(),
      handleCallback: vi.fn(),
      exchangeCode: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [{ provide: OAuthService, useValue: oauthService }],
    }).compile();

    controller = module.get<OAuthController>(OAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('beginFlow', () => {
    it('should redirect to auth url', async () => {
      oauthService.beginFlow.mockResolvedValue({ url: 'http://auth.url' });
      const res = { redirect: vi.fn() } as any;

      await controller.beginFlow('github', '/workspace', res);
      
      expect(oauthService.beginFlow).toHaveBeenCalledWith('github', '/workspace');
      expect(res.redirect).toHaveBeenCalledWith('http://auth.url');
    });
  });

  describe('handleCallback', () => {
    it('should redirect to error if error present', async () => {
      const res = { redirect: vi.fn() } as any;
      await controller.handleCallback('github', '', '', 'access_denied', '', res);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=access_denied'));
    });

    it('should redirect to invalid_request if code or state missing', async () => {
      const res = { redirect: vi.fn() } as any;
      await controller.handleCallback('github', '', 'state1', '', '', res);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=invalid_request'));
    });

    it('should call handleCallback and redirect with code', async () => {
      oauthService.handleCallback.mockResolvedValue({ code: 'code123' });
      const res = { redirect: vi.fn() } as any;

      await controller.handleCallback('github', 'code1', 'state1', '', '', res);

      expect(oauthService.handleCallback).toHaveBeenCalledWith('github', 'code1', 'state1');
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('code=code123'));
    });

    it('should redirect to account_conflict if returned', async () => {
      oauthService.handleCallback.mockResolvedValue({ error: 'account_conflict', email: 'test@test.com' });
      const res = { redirect: vi.fn() } as any;

      await controller.handleCallback('github', 'code1', 'state1', '', '', res);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=account_conflict'));
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('email=test%40test.com'));
    });
  });

  describe('exchangeCode', () => {
    it('should return tokens', async () => {
      const mockResult = { accessToken: 'a', refreshToken: 'r', user: {} as any, returnTo: '/workspace' };
      oauthService.exchangeCode.mockResolvedValue(mockResult);

      const result = await controller.exchangeCode({ code: 'c' });
      expect(result).toBe(mockResult);
      expect(oauthService.exchangeCode).toHaveBeenCalledWith('c');
    });
  });
});
