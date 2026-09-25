// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import BoardPage from './BoardPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as issueService from '../../services/issueService';
import * as memberService from '../../services/memberService';
import type { Issue } from '../../store/types';
import { useProjectWorkflow } from '@/hooks/useProjectWorkflow';

vi.mock('@/hooks/useProjectWorkflow', () => ({
  useProjectWorkflow: vi.fn().mockReturnValue({
    statuses: [
      { id: 'TODO', workflowId: 'wf1', name: 'To Do', category: 'TODO', order: 0, color: '#e2e8f0' },
      { id: 'IN_PROGRESS', workflowId: 'wf1', name: 'In Progress', category: 'IN_PROGRESS', order: 1, color: '#bfdbfe' },
      { id: 'IN_PREVIEW', workflowId: 'wf1', name: 'In Preview', category: 'IN_PREVIEW', order: 2, color: '#fef08a' },
      { id: 'DONE', workflowId: 'wf1', name: 'Done', category: 'DONE', order: 3, color: '#bbf7d0' },
    ],
    isLoading: false,
    isError: false,
    getStatusById: (_id?: string) => undefined,
    getStatusColor: () => '#6B7280',
    getDefaultStatusId: () => 'TODO',
    getAllowedTransitions: () => [],
  }),
  DEFAULT_CATEGORY_COLORS: {
    TODO: '#e2e8f0',
    IN_PROGRESS: '#bfdbfe',
    IN_PREVIEW: '#fef08a',
    DONE: '#bbf7d0',
  },
}));

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
    vi.mocked(useProjectWorkflow).mockReturnValue({
      statuses: [
        { id: 'TODO', workflowId: 'wf1', name: 'To Do', category: 'TODO', order: 0, color: '#e2e8f0' },
        { id: 'IN_PROGRESS', workflowId: 'wf1', name: 'In Progress', category: 'IN_PROGRESS', order: 1, color: '#bfdbfe' },
        { id: 'IN_PREVIEW', workflowId: 'wf1', name: 'In Preview', category: 'IN_PREVIEW', order: 2, color: '#fef08a' },
        { id: 'DONE', workflowId: 'wf1', name: 'Done', category: 'DONE', order: 3, color: '#bbf7d0' },
      ],
      isLoading: false,
      isError: false,
      getStatusById: (_id?: string) => undefined,
      getStatusColor: () => '#6B7280',
      getDefaultStatusId: () => 'TODO',
      getAllowedTransitions: () => [],
    });
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
      targetWorkflowStatusId: 'IN_PROGRESS',
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
        targetWorkflowStatusId: 'DONE',
        beforeIssueId: null,
        afterIssueId: null
      });
    });

    expect(getColText('Done')).toContain('Test Issue 1');
    expect(getColText('To Do')).not.toContain('Test Issue 1');
  });

  it('renders dynamic N columns based on useProjectWorkflow statuses', async () => {
    vi.mocked(useProjectWorkflow).mockReturnValue({
      statuses: [
        { id: 'backlog', workflowId: 'wf1', name: 'Backlog', category: 'TODO', order: 0, color: '#gray' },
        { id: 'in_dev', workflowId: 'wf1', name: 'In Development', category: 'IN_PROGRESS', order: 1, color: '#blue' },
        { id: 'qa', workflowId: 'wf1', name: 'QA Review', category: 'IN_PREVIEW', order: 2, color: '#yellow' },
        { id: 'staging', workflowId: 'wf1', name: 'Staging', category: 'IN_PREVIEW', order: 3, color: '#purple' },
        { id: 'released', workflowId: 'wf1', name: 'Released', category: 'DONE', order: 4, color: '#green' },
      ],
      isLoading: false,
      isError: false,
      getStatusById: () => undefined,
      getStatusColor: () => '#6B7280',
      getDefaultStatusId: () => 'backlog',
      getAllowedTransitions: () => [],
    });

    vi.mocked(issueService.getBoardIssues).mockResolvedValue([]);
    vi.mocked(memberService.getProjectMembers).mockResolvedValue([]);

    renderWithProviders(<BoardPage />);

    expect(await screen.findByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('In Development')).toBeInTheDocument();
    expect(screen.getByText('QA Review')).toBeInTheDocument();
    expect(screen.getByText('Staging')).toBeInTheDocument();
    expect(screen.getByText('Released')).toBeInTheDocument();
  });
});
