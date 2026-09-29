// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/utils/test-utils';
import { SettingsLayout } from './SettingsLayout';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

describe('SettingsLayout', () => {
  it('renders navigation tabs', () => {
    renderWithProviders(<SettingsLayout />, {
      route: '/workspace/settings/profile',
    });
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });
});
