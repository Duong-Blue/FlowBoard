// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import BoardPage from './BoardPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as issueService from '../../services/issueService';
import * as memberService from '../../services/memberService';
import type { Issue } from '../../store/types';

vi.mock('@/hooks/useResolvedProject', () => ({
  useResolvedProject: () => ({
    project: { id: 'proj1', key: 'proj1', organizationId: 'org1' },
    projectId: 'proj1',
    loading: false,
    error: null,
    is404: false,
  }),
}));

vi.mock('../../services/issueService', () => ({
  getBoardIssues: vi.fn(),
  moveIssue: vi.fn(),
}));

vi.mock('../../services/projectService', () => ({
  getProject: vi.fn().mockResolvedValue({ id: 'proj1', key: 'proj1', organizationId: 'org1' }),
}));

vi.mock('../../services/memberService', () => ({
  getProjectMembers: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orgId: 'org1', projectKey: 'proj1', projectId: 'proj1' }),
  };
});

let dndContextProps: any = null;

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    DndContext: (props: any) => {
      dndContextProps = props;
      return <div data-testid="dnd-context">{props.children}</div>;
    },
  };
});

const mockIssue: Issue = {
  id: 'issue-1',
  key: 'PROJ-1',
  title: 'Test Issue 1',
  description: 'desc',
  status: 'TODO',
  priority: 'HIGH',
  projectId: 'proj1',
  reporterId: 'user1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 4 columns: TODO, IN_PROGRESS, IN_PREVIEW, DONE', async () => {
    vi.mocked(issueService.getBoardIssues).mockResolvedValue([]);
    vi.mocked(memberService.getProjectMembers).mockResolvedValue([]);

    renderWithProviders(<BoardPage />);

    expect(await screen.findByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Preview')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders empty columns gracefully', async () => {
    vi.mocked(issueService.getBoardIssues).mockResolvedValue([]);
    vi.mocked(memberService.getProjectMembers).mockResolvedValue([]);

    renderWithProviders(<BoardPage />);
    
    // We expect the columns to exist and perhaps show "No issues" or just empty droppable area
    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });
    
    const todoColumn = screen.getByText('To Do').closest('div');
    expect(todoColumn).toBeInTheDocument();
  });

  it('disables drag for VIEWER role', async () => {
    vi.mocked(issueService.getBoardIssues).mockResolvedValue([mockIssue]);
    vi.mocked(memberService.getProjectMembers).mockResolvedValue([{
      userId: 'user1',
      name: 'User 1',
      email: 'u1@ex.com',
      role: 'VIEWER',
    }]);

    renderWithProviders(<BoardPage />, {
      preloadedState: {
        auth: {
          user: { id: 'user1', email: 'u1@ex.com', name: 'U1' },
          isAuthenticated: true,
          accessToken: 'token',
        }
      }
    });

    const issueCard = await screen.findByText('Test Issue 1');
    expect(issueCard).toBeInTheDocument();
    
    const cardContainer = issueCard.closest('.cursor-default');
    expect(cardContainer).toBeInTheDocument();
  });

  it('allows drag for MEMBER role and handles optimistic update + rollback on error', async () => {
    vi.mocked(issueService.getBoardIssues).mockResolvedValue([mockIssue]);
    vi.mocked(memberService.getProjectMembers).mockResolvedValue([{
      userId: 'user1',
      name: 'User 1',
      email: 'u1@ex.com',
      role: 'MEMBER',
    }]);

    vi.mocked(issueService.moveIssue).mockRejectedValue(new Error('API failed'));

    renderWithProviders(<BoardPage />, {
      preloadedState: {
        auth: {
          user: { id: 'user1', email: 'u1@ex.com', name: 'U1' },
          isAuthenticated: true,
          accessToken: 'token',
        }
      }
    });

    const issueCard = await screen.findByText('Test Issue 1');
    expect(issueCard).toBeInTheDocument();

    const getColText = (title: string) => screen.getByText(title).closest('.flex.flex-col')?.textContent;

    expect(getColText('To Do')).toContain('Test Issue 1');

    await act(async () => {
      dndContextProps.onDragStart({
        active: {
          id: 'issue-1',
          data: {
            current: { issue: mockIssue }
          }
        }
      });
      await dndContextProps.onDragEnd({
        active: {
          id: 'issue-1',
          data: {
            current: { issue: mockIssue, type: 'Issue' }
          },
          rect: { current: { translated: { top: 100 } } }
        },
        over: {
          id: 'IN_PROGRESS',
          data: {
            current: { type: 'Column', columnId: 'IN_PROGRESS' }
          },
          rect: { top: 0, height: 500 }
        }
      });
    });

    expect(issueService.moveIssue).toHaveBeenCalledWith('proj1', 'issue-1', {
      status: 'IN_PROGRESS',
      beforeIssueId: null,
      afterIssueId: null
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to move issue')).toBeInTheDocument();
    });

    expect(getColText('To Do')).toContain('Test Issue 1');
  });

  it('allows drag for MEMBER role and handles optimistic update successfully', async () => {
    vi.mocked(issueService.getBoardIssues).mockResolvedValue([mockIssue]);
    vi.mocked(memberService.getProjectMembers).mockResolvedValue([{
      userId: 'user1',
      name: 'User 1',
      email: 'u1@ex.com',
      role: 'MEMBER',
    }]);

    vi.mocked(issueService.moveIssue).mockResolvedValue(undefined as any);

    renderWithProviders(<BoardPage />, {
      preloadedState: {
        auth: {
          user: { id: 'user1', email: 'u1@ex.com', name: 'U1' },
          isAuthenticated: true,
          accessToken: 'token',
        }
      }
    });

    const issueCard = await screen.findByText('Test Issue 1');
    expect(issueCard).toBeInTheDocument();

    const getColText = (title: string) => screen.getByText(title).closest('.flex.flex-col')?.textContent;

    await act(async () => {
      dndContextProps.onDragEnd({
        active: {
          id: 'issue-1',
          data: {
            current: { issue: mockIssue, type: 'Issue' }
          },
          rect: { current: { translated: { top: 100 } } }
        },
        over: {
          id: 'DONE',
          data: {
            current: { type: 'Column', columnId: 'DONE' }
          },
          rect: { top: 0, height: 500 }
        }
      });
    });

    await waitFor(() => {
      expect(issueService.moveIssue).toHaveBeenCalledWith('proj1', 'issue-1', {
        status: 'DONE',
        beforeIssueId: null,
        afterIssueId: null
      });
    });

    expect(getColText('Done')).toContain('Test Issue 1');
    expect(getColText('To Do')).not.toContain('Test Issue 1');
  });
});
