import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthContext, UserProfile } from '../auth-context.js';
import { FlowBoardApiClient } from '../../client/flowboard-api.client.js';
import { FlowBoardApiError } from '../../client/flowboard-api.errors.js';

describe('Phase 2 Authentication', () => {
  const mockBaseUrl = 'http://api.test';
  const mockToken = 'secret-test-token-12345';
  
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1: Valid bearer token -> FlowBoard API request succeeds', async () => {
    const mockProfile: UserProfile = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
    };
    
    // Mock successful fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    const client = new FlowBoardApiClient(mockBaseUrl, () => mockToken);
    const result = await client.request<UserProfile>('/users/me');

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/users/me`, expect.objectContaining({
      headers: expect.objectContaining({
        'authorization': `Bearer ${mockToken}`,
        'content-type': 'application/json',
      })
    }));
    expect(result).toEqual(mockProfile);
  });

  it('Test 2: Missing token -> deterministic authentication failure', async () => {
    const client = new FlowBoardApiClient(mockBaseUrl, () => '');
    
    expect(client.hasToken()).toBe(false);
    
    await expect(client.request('/users/me')).rejects.toThrow('Missing credentials: No FLOWBOARD_API_TOKEN configured');
    
    const context = new AuthContext(client);
    await context.initialize();
    expect(context.isAuthenticated).toBe(false);
    expect(context.getError()).toBe('Missing credentials: No FLOWBOARD_API_TOKEN configured');
  });

  it('Test 3: Invalid/Expired token -> 401 handling in AuthContext.initialize()', async () => {
    // Mock 401 response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as unknown as Response);

    const client = new FlowBoardApiClient(mockBaseUrl, () => 'invalid-token');
    const context = new AuthContext(client);
    
    await context.initialize();
    
    expect(context.isAuthenticated).toBe(false);
    expect(context.getError()).toBe('Authentication failed: Invalid token (401)');
  });

  it('Test 4: Token is not present in error messages thrown by FlowBoardApiClient', async () => {
    // Mock 500 response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response);

    const client = new FlowBoardApiClient(mockBaseUrl, () => mockToken);
    
    try {
      await client.request('/users/me');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(FlowBoardApiError);
      expect(err.message).not.toContain(mockToken);
      expect(err.message).toBe('API request failed: 500 Internal Server Error');
    }
  });

  it('Test 5: AuthContext correctly parses UserProfile from /users/me on success', async () => {
    const mockProfile: UserProfile = {
      id: '1',
      email: 'user@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      displayName: 'Alice Smith',
    };
    
    // Mock successful fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    const client = new FlowBoardApiClient(mockBaseUrl, () => mockToken);
    const context = new AuthContext(client);
    
    await context.initialize();
    
    expect(context.isAuthenticated).toBe(true);
    expect(context.getError()).toBeNull();
    expect(context.getUser()).toEqual(mockProfile);
  });
});
