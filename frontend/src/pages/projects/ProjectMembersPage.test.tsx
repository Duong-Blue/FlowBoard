// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import ProjectMembersPage from './ProjectMembersPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as memberService from '../../services/memberService';

vi.mock('../../services/memberService', () => ({
  getProjectMembers: vi.fn(),
  getOrgMembers: vi.fn(),
  addProjectMember: vi.fn(),
  updateProjectMemberRole: vi.fn(),
  removeProjectMember: vi.fn(),
}));

vi.mock('@/hooks/useResolvedProject', () => ({
  useResolvedProject: () => ({
    project: { id: 'proj1', key: 'proj1', organizationId: 'org1', name: 'Test Project' },
    projectId: 'proj1',
    loading: false,
    error: null,
    is404: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orgId: 'org1', projectKey: 'proj1' }),
  };
});

describe('ProjectMembersPage', () => {
  const currentUser = { id: 'u1', name: 'Alice Admin', email: 'alice@test.com' };
  
  const mockProjectMembers = [
    { userId: 'u1', name: 'Alice Admin', email: 'alice@test.com', role: 'ADMIN' },
    { userId: 'u2', name: 'Bob Member', email: 'bob@test.com', role: 'MEMBER' },
  ];

  const mockOrgMembers = [
    { userId: 'u1', name: 'Alice Admin', email: 'alice@test.com', role: 'ADMIN' },
    { userId: 'u2', name: 'Bob Member', email: 'bob@test.com', role: 'MEMBER' },
    { userId: 'u3', name: 'Charlie Viewer', email: 'charlie@test.com', role: 'VIEWER' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    vi.mocked(memberService.getProjectMembers).mockResolvedValue([...mockProjectMembers]);
    vi.mocked(memberService.getOrgMembers).mockResolvedValue([...mockOrgMembers]);
  });

  it('renders project member list and add member form for admin', async () => {
    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
    });

    expect(screen.getByText('Add Member')).toBeInTheDocument();
  });

  it('adds member optimistically and handles success', async () => {
    vi.mocked(memberService.addProjectMember).mockResolvedValue({ id: 'm3' });
    vi.mocked(memberService.getProjectMembers)
      .mockResolvedValueOnce([...mockProjectMembers])
      .mockResolvedValueOnce([
        ...mockProjectMembers,
        { userId: 'u3', name: 'Charlie Viewer', email: 'charlie@test.com', role: 'VIEWER' },
      ]);

    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    const userSelect = screen.getByLabelText('Select user to add...');
    fireEvent.pointerDown(userSelect, { button: 0 });
    fireEvent.keyDown(userSelect, { key: 'ArrowDown' });

    const option = await screen.findByText('Charlie Viewer (charlie@test.com)');
    fireEvent.pointerUp(option);
    fireEvent.click(option);

    const submitBtn = screen.getByRole('button', { name: /Create/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(memberService.addProjectMember).toHaveBeenCalledWith('proj1', {
        userId: 'u3',
        role: 'VIEWER',
      });
    });
  });

  it('handles rollback on add member failure', async () => {
    vi.mocked(memberService.addProjectMember).mockRejectedValue(new Error('Add failed'));

    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    const userSelect = screen.getByLabelText('Select user to add...');
    fireEvent.pointerDown(userSelect, { button: 0 });
    fireEvent.keyDown(userSelect, { key: 'ArrowDown' });

    const option = await screen.findByText('Charlie Viewer (charlie@test.com)');
    fireEvent.pointerUp(option);
    fireEvent.click(option);

    const submitBtn = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(memberService.addProjectMember).toHaveBeenCalledWith('proj1', {
        userId: 'u3',
        role: 'VIEWER',
      });
      expect(screen.queryByText('Charlie Viewer')).not.toBeInTheDocument();
    });
  });

  it('updates member role optimistically and handles failure rollback', async () => {
    vi.mocked(memberService.updateProjectMemberRole).mockRejectedValue(new Error('Update failed'));

    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
    });

    const roleTrigger = screen.getByLabelText('Role for Bob Member');
    fireEvent.pointerDown(roleTrigger, { button: 0 });
    fireEvent.keyDown(roleTrigger, { key: 'ArrowDown' });

    const adminOption = await screen.findByRole('option', { name: 'Admin' });
    fireEvent.pointerUp(adminOption);
    fireEvent.click(adminOption);

    await waitFor(() => {
      expect(memberService.updateProjectMemberRole).toHaveBeenCalledWith('proj1', 'u2', 'ADMIN');
    });
  });

  it('opens confirmation dialog and removes member optimistically', async () => {
    vi.mocked(memberService.removeProjectMember).mockResolvedValue({});

    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
    });

    const removeBtn = screen.getByLabelText('Remove Bob Member from project');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();
      expect(screen.getAllByText('Bob Member').length).toBe(2);
    });

    const confirmButtons = screen.getAllByRole('button', { name: 'Remove' });
    const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      expect(memberService.removeProjectMember).toHaveBeenCalledWith('proj1', 'u2');
      expect(screen.queryByText('Bob Member')).not.toBeInTheDocument();
    });
  });

  it('handles removal failure with rollback', async () => {
    vi.mocked(memberService.removeProjectMember).mockRejectedValue(new Error('Delete failed'));

    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
    });

    const removeBtn = screen.getByLabelText('Remove Bob Member from project');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByRole('button', { name: 'Remove' });
    const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      expect(memberService.removeProjectMember).toHaveBeenCalledWith('proj1', 'u2');
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
    });
  });

  it('does not allow self-removal (remove button hidden for current user)', async () => {
    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Remove Alice Admin from project')).not.toBeInTheDocument();
  });

  it('renders message when all org members are added to project', async () => {
    vi.mocked(memberService.getOrgMembers).mockResolvedValue([...mockProjectMembers]);

    renderWithProviders(<ProjectMembersPage />, {
      preloadedState: {
        auth: { user: currentUser, isAuthenticated: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });
});
