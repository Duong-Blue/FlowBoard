// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/utils/test-utils';
import { SecuritySettings } from './SecuritySettings';

vi.mock('@/services/userService', () => ({
  changePassword: vi.fn(),
  setPassword: vi.fn(),
  getSessions: vi.fn().mockResolvedValue([]),
}));

vi.mock('./SessionList', () => ({
  SessionList: () => <div data-testid="session-list" />,
}));

describe('SecuritySettings', () => {
  it('renders change password when hasPassword is true', () => {
    renderWithProviders(<SecuritySettings />, {
      preloadedState: {
        auth: {
          user: { id: '1', hasPassword: true },
          token: 'token',
          isAuthenticated: true,
        },
      },
    });

    const updateBtn = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(updateBtn);
    
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
  });

  it('renders set password when hasPassword is false', () => {
    renderWithProviders(<SecuritySettings />, {
      preloadedState: {
        auth: {
          user: { id: '1', hasPassword: false },
          token: 'token',
          isAuthenticated: true,
        },
      },
    });

    const setBtn = screen.getByRole('button', { name: /set password/i });
    fireEvent.click(setBtn);
    
    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
  });
});
