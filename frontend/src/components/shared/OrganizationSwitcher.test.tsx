// @ts-nocheck
import '@testing-library/jest-dom/vitest';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/utils/test-utils';
import OrganizationSwitcher from './OrganizationSwitcher';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ orgId: 'org-1' }),
  };
});

describe('OrganizationSwitcher', () => {
  const initialOrgState = {
    list: [
      { id: 'org-1', name: 'Acme Corp', slug: 'acme' },
      { id: 'org-2', name: 'Beta Inc', slug: 'beta' },
    ],
    activeOrgId: 'org-1',
    loading: false,
  };

  it('renders active organization name and avatar initials', () => {
    renderWithProviders(<OrganizationSwitcher />, {
      preloadedState: {
        org: initialOrgState,
      },
    });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('@acme')).toBeInTheDocument();
  });

  it('opens dropdown and allows selecting an organization', async () => {
    const onSelectOrg = vi.fn();
    renderWithProviders(<OrganizationSwitcher onSelectOrg={onSelectOrg} />, {
      preloadedState: {
        org: initialOrgState,
      },
    });

    const trigger = screen.getByRole('button', { name: /switch organization/i });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

    const betaOption = await screen.findByText('Beta Inc');
    expect(betaOption).toBeInTheDocument();

    fireEvent.click(betaOption);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/beta/overview');
    expect(onSelectOrg).toHaveBeenCalled();
  });

  it('navigates to create new organization page', async () => {
    renderWithProviders(<OrganizationSwitcher />, {
      preloadedState: {
        org: initialOrgState,
      },
    });

    const trigger = screen.getByRole('button', { name: /switch organization/i });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

    const createOption = await screen.findByText('Create Organization');
    fireEvent.click(createOption);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/new');
  });
});
