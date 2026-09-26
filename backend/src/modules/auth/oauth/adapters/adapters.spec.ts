import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAdapter } from './google.adapter';
import { GitHubAdapter } from './github.adapter';
import { oauthConfig } from '../oauth.config';

// Mock global fetch
const originalFetch = global.fetch;

describe('OAuth Adapters', () => {
  beforeEach(() => {
    // Reset config for tests
    oauthConfig.google.clientId = 'mock-google-client';
    oauthConfig.google.clientSecret = 'mock-google-secret';
    oauthConfig.google.redirectUri = 'http://localhost/google';
    
    oauthConfig.github.clientId = 'mock-github-client';
    oauthConfig.github.clientSecret = 'mock-github-secret';
    oauthConfig.github.redirectUri = 'http://localhost/github';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('GoogleAdapter', () => {
    const adapter = new GoogleAdapter();

    it('should generate correct authorization URL', () => {
      const url = adapter.getAuthorizationUrl('my-state', 'my-challenge');
      const parsed = new URL(url);
      expect(parsed.origin + parsed.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(parsed.searchParams.get('client_id')).toBe('mock-google-client');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('state')).toBe('my-state');
      expect(parsed.searchParams.get('code_challenge')).toBe('my-challenge');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should successfully exchange code and fetch verified profile', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === 'https://oauth2.googleapis.com/token') {
          return {
            ok: true,
            json: async () => ({ access_token: 'google-access-token' }),
          };
        }
        if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
          return {
            ok: true,
            json: async () => ({
              sub: 'google-123',
              email: 'test@google.com',
              email_verified: true,
              given_name: 'John',
              family_name: 'Doe',
              picture: 'http://avatar.com/john.png',
            }),
          };
        }
      });

      const profile = await adapter.exchangeCode('mock-code', 'mock-verifier');
      expect(profile).toEqual({
        id: 'google-123',
        email: 'test@google.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John', // Since we fallback to given_name
        avatarUrl: 'http://avatar.com/john.png',
      });
    });

    it('should throw if email is unverified', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === 'https://oauth2.googleapis.com/token') {
          return { ok: true, json: async () => ({ access_token: 'tok' }) };
        }
        if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
          return {
            ok: true,
            json: async () => ({ email: 'test@google.com', email_verified: false }),
          };
        }
      });

      await expect(adapter.exchangeCode('code', 'ver')).rejects.toThrow('Google email is not verified');
    });

    it('should throw if email is missing', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === 'https://oauth2.googleapis.com/token') {
          return { ok: true, json: async () => ({ access_token: 'tok' }) };
        }
        if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
          return {
            ok: true,
            json: async () => ({ email_verified: true }), // no email
          };
        }
      });

      await expect(adapter.exchangeCode('code', 'ver')).rejects.toThrow('Google profile missing email');
    });
  });

  describe('GitHubAdapter', () => {
    const adapter = new GitHubAdapter();

    it('should generate correct authorization URL', () => {
      const url = adapter.getAuthorizationUrl('gh-state', 'gh-challenge');
      const parsed = new URL(url);
      expect(parsed.origin + parsed.pathname).toBe('https://github.com/login/oauth/authorize');
      expect(parsed.searchParams.get('client_id')).toBe('mock-github-client');
      expect(parsed.searchParams.get('state')).toBe('gh-state');
      expect(parsed.searchParams.get('code_challenge')).toBe('gh-challenge');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('scope')).toContain('user:email');
    });

    it('should successfully exchange code and pick primary verified email', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === 'https://github.com/login/oauth/access_token') {
          return {
            ok: true,
            json: async () => ({ access_token: 'github-access-token' }),
          };
        }
        if (url === 'https://api.github.com/user') {
          return {
            ok: true,
            json: async () => ({
              id: 999,
              login: 'octocat',
              name: 'The Octocat',
              avatar_url: 'http://avatar.com/octocat.png',
            }),
          };
        }
        if (url === 'https://api.github.com/user/emails') {
          return {
            ok: true,
            json: async () => ([
              { email: 'unverified@github.com', primary: true, verified: false },
              { email: 'not-primary@github.com', primary: false, verified: true },
              { email: 'primary@github.com', primary: true, verified: true },
            ]),
          };
        }
      });

      const profile = await adapter.exchangeCode('gh-code', 'gh-ver');
      expect(profile).toEqual({
        id: '999',
        email: 'primary@github.com',
        firstName: 'The',
        lastName: 'Octocat',
        displayName: 'The Octocat',
        avatarUrl: 'http://avatar.com/octocat.png',
      });
    });

    it('should throw if no primary verified email exists', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === 'https://github.com/login/oauth/access_token') {
          return { ok: true, json: async () => ({ access_token: 'tok' }) };
        }
        if (url === 'https://api.github.com/user') {
          return { ok: true, json: async () => ({ id: 1 }) };
        }
        if (url === 'https://api.github.com/user/emails') {
          return {
            ok: true,
            json: async () => ([
              { email: 'unverified@github.com', primary: true, verified: false },
            ]),
          };
        }
      });

      await expect(adapter.exchangeCode('code', 'ver')).rejects.toThrow('GitHub account does not have a primary, verified email');
    });
  });
});
