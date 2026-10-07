// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from './RegisterPage';
import { renderWithProviders } from '../../utils/test-utils';
import { api } from '../../utils/api_helper';

vi.mock('../../utils/api_helper', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register form elements correctly', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits registration form successfully', async () => {
    const mockPost = vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: 'Success' },
    } as any);

    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/register', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'secret123',
      });
    });
  });
});
