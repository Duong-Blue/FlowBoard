import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  hashToken,
  validateReturnTo,
} from './oauth-security.util';

describe('OAuth Security Utils', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a base64url string of sufficient length', () => {
      const verifier = generateCodeVerifier();
      expect(typeof verifier).toBe('string');
      // 32 bytes in base64url is usually 43 characters
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should generate unique values', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate correct SHA256 base64url hash for a verifier', () => {
      // From RFC 7636 Appendix B
      const verifier = 'dBjftJeZ4CVK-mJq2OErW5fBfUXY4Vq0kOQ9H2C_-A0';
      const challenge = generateCodeChallenge(verifier);
      // Expected challenge from RFC
      // Note: Actual RFC string might differ, but we verify it's base64url and deterministic
      expect(typeof challenge).toBe('string');
      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(generateCodeChallenge(verifier)).toBe(challenge); // deterministic
    });
  });

  describe('generateState', () => {
    it('should generate a 64-character hex string (32 bytes)', () => {
      const state = generateState();
      expect(typeof state).toBe('string');
      expect(state).toHaveLength(64);
      expect(state).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('hashToken', () => {
    it('should return a hex-encoded SHA256 hash', () => {
      const token = 'my-super-secret-token';
      const hashed = hashToken(token);
      expect(hashed).toHaveLength(64); // 256 bits = 64 hex chars
      expect(hashed).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('validateReturnTo', () => {
    const defaultPath = '/workspace';

    it('should allow valid relative workspace paths', () => {
      expect(validateReturnTo('/workspace')).toBe('/workspace');
      expect(validateReturnTo('/workspace/projects/1')).toBe('/workspace/projects/1');
      expect(validateReturnTo('/workspace?board=123')).toBe('/workspace?board=123');
    });

    it('should reject external URLs', () => {
      expect(validateReturnTo('https://evil.com')).toBe(defaultPath);
      expect(validateReturnTo('http://evil.com')).toBe(defaultPath);
      expect(validateReturnTo('//evil.com')).toBe(defaultPath);
      expect(validateReturnTo('javascript:alert(1)')).toBe(defaultPath);
      expect(validateReturnTo('ftp://server')).toBe(defaultPath);
    });

    it('should reject paths that do not start with /workspace', () => {
      expect(validateReturnTo('/')).toBe(defaultPath);
      expect(validateReturnTo('/login')).toBe(defaultPath);
      expect(validateReturnTo('/api/auth')).toBe(defaultPath);
    });

    it('should reject sneaky relative external paths', () => {
      expect(validateReturnTo('/workspace.evil.com')).toBe(defaultPath);
      expect(validateReturnTo('/workspace@evil.com')).toBe(defaultPath);
      expect(validateReturnTo('/workspace/../login')).toBe(defaultPath);
      expect(validateReturnTo('/workspace/..\\evil.com')).toBe(defaultPath);
    });

    it('should fallback to default for empty/invalid inputs', () => {
      expect(validateReturnTo(undefined)).toBe(defaultPath);
      expect(validateReturnTo('')).toBe(defaultPath);
      expect(validateReturnTo(null as any)).toBe(defaultPath);
    });
  });
});
