// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import OAuthCallbackPage from './OAuthCallbackPage';
import { OAuthButtons } from '../../components/shared/OAuthButtons';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as apiHelper from '../../utils/api_helper';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
    useLocation: () => ({ state: { from: { pathname: '/workspace/orgs/1' } } }),
  };
});

vi.mock('../../utils/api_helper', async () => {
  const actual = await vi.importActual('../../utils/api_helper');
  return {
    ...actual,
    apiPost: vi.fn(),
  };
});

describe('OAuth Component & Callback Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('OAuthButtons', () => {
    it('renders Google and GitHub buttons with accessible aria-labels', () => {
      renderWithProviders(<OAuthButtons />);

      const googleBtn = screen.getByRole('button', { name: /Google/i });
      const githubBtn = screen.getByRole('button', { name: /GitHub/i });

      expect(googleBtn).toBeInTheDocument();
      expect(githubBtn).toBeInTheDocument();
    });
  });

  describe('OAuthCallbackPage', () => {
    it('executes exchange API on code param present and redirects to returnTo', async () => {
      mockSearchParams = new URLSearchParams({ code: 'valid-code' });
      vi.mocked(apiHelper.apiPost).mockResolvedValueOnce({
        user: { id: 'u1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'acc-token',
        refreshToken: 'ref-token',
        returnTo: '/workspace/orgs/1',
      });

      const { store } = renderWithProviders(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(apiHelper.apiPost).toHaveBeenCalledWith('/auth/oauth/exchange', { code: 'valid-code' });
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(true);
        expect(state.auth.user?.email).toBe('test@example.com');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/1', { replace: true });
    });

    it('renders account conflict error state when error=account_conflict', async () => {
      mockSearchParams = new URLSearchParams({
        error: 'account_conflict',
        email: 'existing@example.com',
      });

      renderWithProviders(<OAuthCallbackPage />);

      expect(await screen.findByText(/existing@example.com/i)).toBeInTheDocument();

      const backBtn = screen.getByRole('button', { name: /Back to Login|Quay lại Đăng nhập/i });
      expect(backBtn).toBeInTheDocument();

      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('renders invalid state error when error=invalid_state', async () => {
      mockSearchParams = new URLSearchParams({ error: 'invalid_state' });

      renderWithProviders(<OAuthCallbackPage />);

      expect(await screen.findByRole('button', { name: /Back to Login|Quay lại Đăng nhập/i })).toBeInTheDocument();
    });
  });
});
