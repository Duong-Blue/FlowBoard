// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import { renderWithProviders } from '../../utils/test-utils';
import { api } from '../../utils/api_helper';

vi.mock('../../utils/api_helper', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form elements correctly', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('submits form with user credentials', async () => {
    const mockPost = vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        user: { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    } as any);

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
