// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/utils/test-utils';
import { WelcomeSection } from './WelcomeSection';
import type { Organization } from '@/store/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WelcomeSection', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders greeting with user name when provided', () => {
    renderWithProviders(<WelcomeSection userName="John Doe" organizations={[]} />);
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('renders fallback greeting when user name is missing or empty', () => {
    renderWithProviders(<WelcomeSection organizations={[]} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('routes to /workspace/orgs/new when Create Project is clicked with 0 orgs', () => {
    renderWithProviders(<WelcomeSection organizations={[]} />);
    const createProjectBtn = screen.getByRole('button', { name: /Create Project|Tạo dự án/i });
    fireEvent.click(createProjectBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/new');
  });

  it('routes directly to /workspace/orgs/:orgId/projects/new when Create Project is clicked with 1 org', () => {
    const singleOrg: Organization[] = [{ id: 'org-123', name: 'Acme Corp', slug: 'acme' }];
    renderWithProviders(<WelcomeSection organizations={singleOrg} />);
    const createProjectBtn = screen.getByRole('button', { name: /Create Project|Tạo dự án/i });
    fireEvent.click(createProjectBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/org-123/projects/new');
  });

  it('opens CreateProjectOrgSelectDialog when Create Project is clicked with multiple orgs', () => {
    const multiOrgs: Organization[] = [
      { id: 'org-1', name: 'Org One', slug: 'org1' },
      { id: 'org-2', name: 'Org Two', slug: 'org2' },
    ];
    renderWithProviders(<WelcomeSection organizations={multiOrgs} />);
    const createProjectBtn = screen.getByRole('button', { name: /Create Project|Tạo dự án/i });
    fireEvent.click(createProjectBtn);
    
    expect(screen.getByText('Org One')).toBeInTheDocument();
    expect(screen.getByText('Org Two')).toBeInTheDocument();
  });

  it('routes to /workspace/orgs/new when Create Organization is clicked', () => {
    renderWithProviders(<WelcomeSection organizations={[]} />);
    const createOrgBtn = screen.getByRole('button', { name: /Create Organization|Tạo tổ chức/i });
    fireEvent.click(createOrgBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/new');
  });

  it('routes to /workspace/join when Join Organization is clicked', () => {
    renderWithProviders(<WelcomeSection organizations={[]} />);
    const joinOrgBtn = screen.getByRole('button', { name: /Join Organization|Tham gia tổ chức/i });
    fireEvent.click(joinOrgBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/workspace/join');
  });
});
