// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../utils/test-utils';
import { ActivityTimeline } from '../components/ActivityTimeline';
import * as issueService from '../../../services/issueService';
import type { IssueActivity } from '../../../services/issueService';

vi.mock('../../../services/issueService', async () => {
  const actual = await vi.importActual('../../../services/issueService');
  return {
    ...actual,
    getActivities: vi.fn(),
  };
});

const mockActor = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  email: 'john@example.com',
};

const mockActivities: IssueActivity[] = [
  {
    id: 'act-1',
    issueId: 'issue-1',
    actorId: 'user-1',
    actor: mockActor,
    type: 'STATUS_CHANGED',
    metadata: { from: 'TODO', to: 'IN_PROGRESS' },
    createdAt: '2026-01-01T12:00:00.000Z',
  },
  {
    id: 'act-2',
    issueId: 'issue-1',
    actorId: 'user-1',
    actor: mockActor,
    type: 'TITLE_CHANGED',
    metadata: { from: 'Old Title', to: 'New Title' },
    createdAt: '2026-01-01T12:05:00.000Z',
  },
  {
    id: 'act-3',
    issueId: 'issue-1',
    actorId: 'user-1',
    actor: mockActor,
    type: 'ASSIGNEE_CHANGED',
    metadata: { toName: 'Alice' },
    createdAt: '2026-01-01T12:10:00.000Z',
  },
  {
    id: 'act-4',
    issueId: 'issue-1',
    actorId: 'user-1',
    actor: mockActor,
    type: 'ISSUE_CREATED',
    metadata: {},
    createdAt: '2026-01-01T11:00:00.000Z',
  },
  {
    id: 'act-5',
    issueId: 'issue-1',
    actorId: 'user-1',
    actor: mockActor,
    type: 'PRIORITY_CHANGED',
    metadata: { from: 'LOW', to: 'URGENT' },
    createdAt: '2026-01-01T12:15:00.000Z',
  },
];

const mockNullActorActivity: IssueActivity = {
  id: 'act-6',
  issueId: 'issue-1',
  actorId: null,
  actor: null,
  type: 'COMMENT_CREATED',
  metadata: {},
  createdAt: '2026-01-01T12:20:00.000Z',
};

describe('ActivityTimeline Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity items formatted into human-readable text for various event types', async () => {
    vi.mocked(issueService.getActivities).mockResolvedValue({
      items: mockActivities,
      meta: { total: 5, page: 1, limit: 20, totalPages: 1 },
    });

    renderWithProviders(
      <ActivityTimeline projectId="proj-1" issueId="issue-1" />
    );

    await waitFor(() => {
      expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
    });

    expect(screen.getByText(/changed status from/i)).toBeInTheDocument();
    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();

    expect(screen.getByText(/changed title from/i)).toBeInTheDocument();
    expect(screen.getByText('Old Title')).toBeInTheDocument();
    expect(screen.getByText('New Title')).toBeInTheDocument();

    expect(screen.getByText(/assigned issue to/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();

    expect(screen.getByText('created this issue')).toBeInTheDocument();
    expect(screen.getByText(/changed priority from/i)).toBeInTheDocument();
  });

  it('renders "Deleted User" fallback for activity with null actor', async () => {
    vi.mocked(issueService.getActivities).mockResolvedValue({
      items: [mockNullActorActivity],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    renderWithProviders(
      <ActivityTimeline projectId="proj-1" issueId="issue-1" />
    );

    await waitFor(() => {
      expect(screen.getByText('Deleted User')).toBeInTheDocument();
    });

    expect(screen.getByText('added a comment')).toBeInTheDocument();
  });

  it('renders empty state when there are no activities', async () => {
    vi.mocked(issueService.getActivities).mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    renderWithProviders(
      <ActivityTimeline projectId="proj-1" issueId="issue-1" />
    );

    await waitFor(() => {
      expect(screen.getByText('No activity recorded yet')).toBeInTheDocument();
    });
  });

  it('renders error state when fetch fails', async () => {
    vi.mocked(issueService.getActivities).mockRejectedValue(new Error('Failed to load activity log'));

    renderWithProviders(
      <ActivityTimeline projectId="proj-1" issueId="issue-1" />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load activity log')).toBeInTheDocument();
    });
  });
});
