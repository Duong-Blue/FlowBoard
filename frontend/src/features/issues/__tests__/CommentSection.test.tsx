// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../utils/test-utils';
import { CommentSection } from '../components/CommentSection';
import * as issueService from '../../../services/issueService';
import type { Comment } from '../../../services/issueService';

vi.mock('../../../services/issueService', async () => {
  const actual = await vi.importActual('../../../services/issueService');
  return {
    ...actual,
    getComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };
});

const mockComment: Comment = {
  id: 'comment-1',
  issueId: 'issue-1',
  authorId: 'user-1',
  author: {
    id: 'user-1',
    firstName: 'Jane',
    lastName: 'Doe',
    displayName: 'Jane Doe',
    email: 'jane@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  content: 'This is a test comment',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
};

const mockNullAuthorComment: Comment = {
  id: 'comment-2',
  issueId: 'issue-1',
  authorId: null,
  author: null,
  content: 'Comment by deleted user',
  createdAt: '2026-01-01T11:00:00.000Z',
  updatedAt: '2026-01-01T11:00:00.000Z',
};

describe('CommentSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comment list with author avatar/name, timestamp, content', async () => {
    vi.mocked(issueService.getComments).mockResolvedValue({
      items: [mockComment],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    renderWithProviders(
      <CommentSection projectId="proj-1" issueId="issue-1" userRole="MEMBER" />,
      {
        preloadedState: {
          auth: {
            user: { id: 'user-1', email: 'jane@example.com', name: 'Jane Doe' },
            isAuthenticated: true,
            accessToken: 'token',
          },
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Comments (1)')).toBeInTheDocument();
  });

  it('renders empty state when there are no comments', async () => {
    vi.mocked(issueService.getComments).mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    renderWithProviders(
      <CommentSection projectId="proj-1" issueId="issue-1" userRole="MEMBER" />
    );

    await waitFor(() => {
      expect(screen.getByText('No comments yet. Be the first to add one!')).toBeInTheDocument();
    });
  });

  it('submits new comment through composer', async () => {
    vi.mocked(issueService.getComments).mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
    vi.mocked(issueService.createComment).mockResolvedValue(mockComment);

    renderWithProviders(
      <CommentSection projectId="proj-1" issueId="issue-1" userRole="MEMBER" />,
      {
        preloadedState: {
          auth: {
            user: { id: 'user-1', email: 'jane@example.com', name: 'Jane Doe' },
            isAuthenticated: true,
            accessToken: 'token',
          },
        },
      }
    );

    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'New comment test' } });

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(issueService.createComment).toHaveBeenCalledWith('proj-1', 'issue-1', 'New comment test');
    });
  });

  it('handles permission checks: shows edit/delete buttons for author or ADMIN, hides for non-author MEMBER', async () => {
    vi.mocked(issueService.getComments).mockResolvedValue({
      items: [mockComment],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    // Case 1: User is non-author MEMBER -> no edit/delete buttons
    const { unmount } = renderWithProviders(
      <CommentSection projectId="proj-1" issueId="issue-1" userRole="MEMBER" />,
      {
        preloadedState: {
          auth: {
            user: { id: 'user-2', email: 'other@example.com', name: 'Other User' },
            isAuthenticated: true,
            accessToken: 'token',
          },
          issue: {
            comments: {
              items: [mockComment],
              meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
              loading: false,
              error: null,
            },
          } as any,
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    // Check that no buttons are in the comment item header for edit/delete
    const buttons = screen.queryAllByRole('button');
    // composer submit button may be present, but no icon buttons in comment item
    const iconButtons = buttons.filter(b => b.className.includes('h-6 w-6'));
    expect(iconButtons).toHaveLength(0);

    unmount();

    // Case 2: User is ADMIN (non-author) -> edit/delete buttons visible
    renderWithProviders(
      <CommentSection projectId="proj-1" issueId="issue-1" userRole="ADMIN" />,
      {
        preloadedState: {
          auth: {
            user: { id: 'user-2', email: 'admin@example.com', name: 'Admin User' },
            isAuthenticated: true,
            accessToken: 'token',
          },
          issue: {
            comments: {
              items: [mockComment],
              meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
              loading: false,
              error: null,
            },
          } as any,
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const adminButtons = screen.getAllByRole('button');
    const adminIconButtons = adminButtons.filter(b => b.className.includes('h-6 w-6'));
    expect(adminIconButtons.length).toBeGreaterThan(0);
  });

  it('renders "Deleted User" fallback for comment with null author', async () => {
    vi.mocked(issueService.getComments).mockResolvedValue({
      items: [mockNullAuthorComment],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    renderWithProviders(
      <CommentSection projectId="proj-1" issueId="issue-1" userRole="MEMBER" />
    );

    await waitFor(() => {
      expect(screen.getByText('Deleted User')).toBeInTheDocument();
    });

    expect(screen.getByText('Comment by deleted user')).toBeInTheDocument();
  });
});
