// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { IssueFormDialog } from '@/pages/projects/components/IssueFormDialog';
import { IssueMetadataSidebar } from '../IssueMetadataSidebar';
import { SubtaskSection } from '../SubtaskSection';
import { IssueCard } from '@/pages/projects/components/IssueCard';
import type { Issue } from '@/store/types';

vi.mock('@/hooks/useProjectWorkflow', () => ({
  useProjectWorkflow: vi.fn().mockReturnValue({
    statuses: [
      { id: 'ws-todo', workflowId: 'wf1', name: 'Backlog', category: 'TODO', order: 0, color: '#e2e8f0' },
      { id: 'ws-inprog', workflowId: 'wf1', name: 'In Progress', category: 'IN_PROGRESS', order: 1, color: '#bfdbfe' },
      { id: 'ws-done', workflowId: 'wf1', name: 'Completed', category: 'DONE', order: 2, color: '#bbf7d0' },
    ],
    isLoading: false,
    isError: false,
    getStatusById: (id?: string) => {
      const list = [
        { id: 'ws-todo', workflowId: 'wf1', name: 'Backlog', category: 'TODO', order: 0, color: '#e2e8f0' },
        { id: 'ws-inprog', workflowId: 'wf1', name: 'In Progress', category: 'IN_PROGRESS', order: 1, color: '#bfdbfe' },
        { id: 'ws-done', workflowId: 'wf1', name: 'Completed', category: 'DONE', order: 2, color: '#bbf7d0' },
      ];
      return list.find(s => s.id === id || s.category === id);
    },
    getStatusColor: (id?: string) => '#e2e8f0',
    getDefaultStatusId: (cat?: string) => {
      if (cat === 'DONE') return 'ws-done';
      return 'ws-todo';
    },
    getAllowedTransitions: (fromId?: string) => [
      { id: 'ws-todo', workflowId: 'wf1', name: 'Backlog', category: 'TODO', order: 0, color: '#e2e8f0' },
      { id: 'ws-inprog', workflowId: 'wf1', name: 'In Progress', category: 'IN_PROGRESS', order: 1, color: '#bfdbfe' },
    ],
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orgId: 'org1', projectKey: 'proj1', projectId: 'proj1' }),
  };
});

const mockIssue: Issue = {
  id: 'issue-1',
  projectId: 'proj1',
  key: 'PROJ-1',
  title: 'Test Issue 1',
  description: 'desc',
  status: 'TODO',
  workflowStatusId: 'ws-todo',
  priority: 'HIGH',
  reporterId: 'user1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  subtasks: [
    {
      id: 'sub-1',
      projectId: 'proj1',
      key: 'PROJ-2',
      title: 'Subtask 1',
      status: 'DONE',
      workflowStatusId: 'ws-done',
      priority: 'LOW',
      reporterId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]
};

describe('Issue Workflow Integration Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('IssueCard displays workflow status name', () => {
    renderWithProviders(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  it('IssueFormDialog sends workflowStatusId on submit', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <IssueFormDialog
        open={true}
        onOpenChange={() => {}}
        members={[]}
        onSubmit={handleSubmit}
        projectId="proj1"
      />
    );

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Workflow Issue' } });

    const submitBtn = screen.getByRole('button', { name: /create|submit|save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Workflow Issue',
          workflowStatusId: 'ws-todo',
        })
      );
    });
  });

  it('IssueMetadataSidebar renders status badge with custom workflow status name', () => {
    renderWithProviders(
      <IssueMetadataSidebar
        issue={mockIssue}
        members={[]}
        onUpdate={() => {}}
      />
    );
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  it('SubtaskSection correctly calculates completed count for category DONE', () => {
    renderWithProviders(
      <SubtaskSection projectId="proj1" issueId="issue-1" subtasks={mockIssue.subtasks} />
    );
    expect(screen.getByText('1 of 1 (100%)')).toBeInTheDocument();
  });
});
