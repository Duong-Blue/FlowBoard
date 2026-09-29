// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/utils/test-utils';
import { AppearanceSettings } from './AppearanceSettings';
import * as userService from '@/services/userService';

vi.mock('@/services/userService', () => ({
  updateUserProfile: vi.fn(),
}));

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('AppearanceSettings', () => {
  it('changes theme', async () => {
    renderWithProviders(<AppearanceSettings />);
    
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    
    const darkButton = screen.getByRole('button', { name: /sleek dark theme/i });
    fireEvent.click(darkButton);

    await waitFor(() => {
      expect(userService.updateUserProfile).toHaveBeenCalledWith({ theme: 'dark' });
    });
  });
});
