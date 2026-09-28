// @ts-nocheck
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/utils/test-utils';
import { MyWorkList } from './MyWorkList';
import type { Issue } from '@/store/types';

describe('MyWorkList', () => {
  it('renders loading skeleton when loading is true', () => {
    const { container } = renderWithProviders(<MyWorkList loading={true} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders truthful empty state when issues array is empty', () => {
    renderWithProviders(<MyWorkList issues={[]} loading={false} />);
    expect(
      screen.getByText(/All Caught Up!|No assigned work|Đã hoàn tất công việc!|Chưa có công việc được giao/i)
    ).toBeInTheDocument();
  });

  it('renders list of assigned issues with type icon, key, title, badges, and due date', () => {
    const mockIssues: Issue[] = [
      {
        id: 'issue-1',
        projectId: 'proj-1',
        key: 'FB-101',
        title: 'Fix authentication bug',
        status: 'IN_PROGRESS',
        type: 'BUG',
        priority: 'HIGH',
        reporterId: 'user-1',
        assigneeId: 'user-current',
        dueDate: '2026-10-15T00:00:00.000Z',
        projectKey: 'FB',
        projectName: 'FlowBoard',
        orgId: 'org-1',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-02T00:00:00.000Z',
      },
      {
        id: 'issue-2',
        projectId: 'proj-1',
        key: 'FB-102',
        title: 'Design user profile header',
        status: 'TODO',
        type: 'STORY',
        priority: 'MEDIUM',
        reporterId: 'user-1',
        assigneeId: 'user-current',
        projectKey: 'FB',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-02T00:00:00.000Z',
      },
    ];

    renderWithProviders(<MyWorkList issues={mockIssues} loading={false} />);

    expect(screen.getByText('FB-101')).toBeInTheDocument();
    expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    expect(screen.getByText('FB-102')).toBeInTheDocument();
    expect(screen.getByText('Design user profile header')).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });
});
