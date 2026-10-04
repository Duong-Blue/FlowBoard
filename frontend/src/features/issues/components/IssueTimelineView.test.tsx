// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import { IssueTimelineView } from './IssueTimelineView';
import { describe, it, expect, vi } from 'vitest';
import type { Issue } from '@/store/types';

const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    projectId: 'proj-1',
    key: 'FLOW-1',
    title: 'Scheduled Feature Task',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    startDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'issue-2',
    projectId: 'proj-1',
    key: 'FLOW-2',
    title: 'Unscheduled Bug Report',
    status: 'TODO',
    priority: 'URGENT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('IssueTimelineView', () => {
  it('renders timeline header, scheduled issue bars, and unscheduled drawer', () => {
    const handleIssueClick = vi.fn();
    const handleUpdateDates = vi.fn();

    renderWithProviders(
      <IssueTimelineView
        issues={mockIssues}
        onIssueClick={handleIssueClick}
        onUpdateIssueDates={handleUpdateDates}
      />
    );

    expect(screen.getByText('Issue Timeline')).toBeInTheDocument();
    expect(screen.getAllByText('Scheduled Feature Task').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Unscheduled Bug Report').length).toBeGreaterThan(0);
    expect(screen.getByText('Unscheduled Issues')).toBeInTheDocument();
  });

  it('switches time modes when mode buttons are clicked', () => {
    renderWithProviders(<IssueTimelineView issues={mockIssues} />);

    const daysBtn = screen.getByRole('button', { name: 'Days' });
    const weeksBtn = screen.getByRole('button', { name: 'Weeks' });
    const monthsBtn = screen.getByRole('button', { name: 'Months' });

    expect(daysBtn).toBeInTheDocument();
    expect(weeksBtn).toBeInTheDocument();
    expect(monthsBtn).toBeInTheDocument();

    fireEvent.click(weeksBtn);
    expect(screen.getByText('Week 1')).toBeInTheDocument();

    fireEvent.click(monthsBtn);
    expect(screen.getAllByText(/202\d/).length).toBeGreaterThan(0);
  });

  it('triggers onIssueClick when an issue bar or list item is clicked', () => {
    const handleIssueClick = vi.fn();

    renderWithProviders(
      <IssueTimelineView issues={mockIssues} onIssueClick={handleIssueClick} />
    );

    const issueItems = screen.getAllByText('Scheduled Feature Task');
    fireEvent.click(issueItems[0]);

    expect(handleIssueClick).toHaveBeenCalledWith('issue-1');
  });

  it('allows quick scheduling an unscheduled issue', () => {
    const handleUpdateDates = vi.fn();

    renderWithProviders(
      <IssueTimelineView issues={mockIssues} onUpdateIssueDates={handleUpdateDates} />
    );

    const quickScheduleBtn = screen.getByRole('button', { name: '+ 7 Days' });
    fireEvent.click(quickScheduleBtn);

    expect(handleUpdateDates).toHaveBeenCalledWith('issue-2', expect.any(String), expect.any(String));
  });
});
