// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/utils/test-utils';
import { ProfileSettings } from './ProfileSettings';
import * as userService from '@/services/userService';

vi.mock('@/services/userService', () => ({
  updateUserProfile: vi.fn(),
}));

describe('ProfileSettings', () => {
  it('renders profile form and submits', async () => {
    (userService.updateUserProfile as any).mockResolvedValue({
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
      displayName: 'Janey',
      bio: 'Hello world',
    });

    renderWithProviders(<ProfileSettings />, {
      preloadedState: {
        auth: {
          user: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            displayName: '',
            bio: '',
            email: 'john@example.com',
          },
          token: 'token',
          isAuthenticated: true,
          status: 'succeeded',
        },
      },
    });

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(userService.updateUserProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: null,
        bio: null,
      });
    });
  });
});
