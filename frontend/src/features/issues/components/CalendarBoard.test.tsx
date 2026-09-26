// @ts-nocheck
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import { CalendarBoard } from './CalendarBoard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as issueService from '../../../services/issueService';

vi.mock('@/hooks/useProjectWorkflow', () => ({
  useProjectWorkflow: () => ({
    statuses: [
      { id: 's1', workflowId: 'wf1', name: 'Custom To Do', category: 'TODO', order: 0, color: '#3b82f6' },
      { id: 's2', workflowId: 'wf1', name: 'Custom Done', category: 'DONE', order: 1, color: '#10b981' },
    ],
    isLoading: false,
    isError: false,
    getStatusById: (id?: string) => {
      if (id === 's1') return { id: 's1', workflowId: 'wf1', name: 'Custom To Do', category: 'TODO', order: 0, color: '#3b82f6' };
      if (id === 's2') return { id: 's2', workflowId: 'wf1', name: 'Custom Done', category: 'DONE', order: 1, color: '#10b981' };
      return undefined;
    },
    getStatusColor: (id?: string) => (id === 's1' ? '#3b82f6' : id === 's2' ? '#10b981' : '#6B7280'),
    getDefaultStatusId: () => 's1',
    getAllowedTransitions: () => [],
  }),
  DEFAULT_CATEGORY_COLORS: {
    TODO: '#e2e8f0',
    DONE: '#bbf7d0',
  },
}));

vi.mock('../../../services/issueService', () => ({
  getIssues: vi.fn(),
}));

describe('CalendarBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status badges with custom workflow status names and colors', async () => {
    const todayStr = new Date().toISOString();
    vi.mocked(issueService.getIssues).mockResolvedValue({
      items: [
        {
          id: 'issue-1',
          key: 'CAL-1',
          title: 'Calendar Task 1',
          status: 'TODO',
          workflowStatusId: 's1',
          startDate: todayStr,
          dueDate: todayStr,
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });

    renderWithProviders(
      <CalendarBoard projectId="proj1" orgId="org1" projectKey="PROJ1" />
    );

    const taskElements = await screen.findAllByText('Calendar Task 1');
    expect(taskElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Custom To Do').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Calendar').length).toBeGreaterThan(0);
  });

  it('renders error state with retry button when fetching fails', async () => {
    vi.mocked(issueService.getIssues).mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <CalendarBoard projectId="proj1" orgId="org1" projectKey="PROJ1" />
    );

    expect(await screen.findByText(/An error occurred|Failed to load/i)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
