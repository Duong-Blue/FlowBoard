import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowBoardApiClient } from './flowboard-api.client.js';
import { FlowBoardApiError } from './flowboard-api.errors.js';

describe('FlowBoardApiClient', () => {
  const baseUrl = 'http://api.flowboard.test';
  const token = 'test-token';
  const tokenGetter = () => token;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should include correct headers', async () => {
    const client = new FlowBoardApiClient(baseUrl, tokenGetter);
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'ok' }),
    } as Response);

    await client.request('/test');

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/test`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'authorization': `Bearer ${token}`,
          'content-type': 'application/json',
        }),
      })
    );
  });

  it('should enforce origin security', async () => {
    const client = new FlowBoardApiClient(baseUrl, tokenGetter);
    await expect(client.request('http://evil.com/leak')).rejects.toThrow('Security Error');
  });

  it('should map API errors', async () => {
    const client = new FlowBoardApiClient(baseUrl, tokenGetter);
    
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Bad token' }),
    } as Response);

    await expect(client.request('/test')).rejects.toThrow(FlowBoardApiError);
    try {
      await client.request('/test');
    } catch (e: any) {
      expect(e.code).toBe('UNAUTHORIZED');
      expect(e.details.message).toBe('Bad token');
    }
  });

  it('should apply timeout signal', async () => {
    const client = new FlowBoardApiClient(baseUrl, tokenGetter);
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    
    await client.request('/test');
    
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });
});
