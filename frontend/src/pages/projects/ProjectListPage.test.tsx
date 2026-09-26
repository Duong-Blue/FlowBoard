// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import ProjectListPage from './ProjectListPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as projectService from '../../services/projectService';

const mockNavigate = vi.fn();

vi.mock('../../services/projectService', () => ({
  getProjects: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orgId: 'org-123' }),
    useNavigate: () => mockNavigate,
  };
});

describe('ProjectListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and renders project list', async () => {
    vi.mocked(projectService.getProjects).mockResolvedValue([
      { id: 'p1', key: 'PROJ1', name: 'Project One', description: 'Desc 1', issueCount: 5, memberCount: 2 },
    ]);

    renderWithProviders(<ProjectListPage />);

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });
    expect(screen.getByText('PROJ1')).toBeInTheDocument();
  });

  it('renders error state and retries on button click', async () => {
    vi.mocked(projectService.getProjects).mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<ProjectListPage />);

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    const retryBtn = screen.getByText('Retry');
    expect(retryBtn).toBeInTheDocument();

    vi.mocked(projectService.getProjects).mockResolvedValueOnce([
      { id: 'p1', key: 'PROJ1', name: 'Project One', description: 'Desc 1' },
    ]);

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });
  });

  it('filters projects by search input', async () => {
    vi.mocked(projectService.getProjects).mockResolvedValue([
      { id: 'p1', key: 'ALPHA', name: 'Alpha Project', description: 'First' },
      { id: 'p2', key: 'BETA', name: 'Beta Project', description: 'Second' },
    ]);

    renderWithProviders(<ProjectListPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
      expect(screen.getByText('Beta Project')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search projects by name or key...');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();
  });

  it('isolates members and settings button navigation', async () => {
    vi.mocked(projectService.getProjects).mockResolvedValue([
      { id: 'p1', key: 'PROJ1', name: 'Project One', description: 'Desc 1' },
    ]);

    renderWithProviders(<ProjectListPage />);

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });

    const membersBtn = screen.getByRole('button', { name: 'Members - Project One' });
    fireEvent.click(membersBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/org-123/projects/PROJ1/members');
  });
});
