// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../utils/test-utils';
import { IssueDetailView } from '../components/IssueDetailView';
import type { Issue, IssueUser } from '@/store/types';

vi.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, value, onValueChange }: any) => (
      <div data-testid="select-container">
        <select
          data-testid="mock-select"
          value={value || ''}
          onChange={(e) => onValueChange && onValueChange(e.target.value)}
        >
          {children}
        </select>
      </div>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  };
});

const mockIssue: Issue = {
  id: 'issue-1',
  key: 'PROJ-101',
  title: 'Test Issue Title',
  description: 'Original description content',
  status: 'TODO',
  priority: 'HIGH',
  projectId: 'proj-1',
  reporterId: 'user-1',
  assigneeId: 'user-2',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  reporter: {
    id: 'user-1',
    firstName: 'Alice',
    lastName: 'Reporter',
    displayName: 'Alice Reporter',
    email: 'alice@example.com',
  },
  assignee: {
    id: 'user-2',
    firstName: 'Bob',
    lastName: 'Assignee',
    displayName: 'Bob Assignee',
    email: 'bob@example.com',
  },
};

const mockMembers: IssueUser[] = [
  { id: 'user-1', firstName: 'Alice', lastName: 'Reporter', displayName: 'Alice Reporter', email: 'alice@example.com' },
  { id: 'user-2', firstName: 'Bob', lastName: 'Assignee', displayName: 'Bob Assignee', email: 'bob@example.com' },
];

describe('IssueDetailView Component', () => {
  const onUpdateMock = vi.fn().mockResolvedValue(undefined);
  const onDeleteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders issue metadata, title, key, status, priority, reporter, and assignee', () => {
    renderWithProviders(
      <IssueDetailView
        issue={mockIssue}
        members={mockMembers}
        onUpdate={onUpdateMock}
        canDelete={true}
        onDelete={onDeleteMock}
      />
    );

    expect(screen.getByText('PROJ-101')).toBeInTheDocument();
    expect(screen.getByText('Test Issue Title')).toBeInTheDocument();
    expect(screen.getByText('Original description content')).toBeInTheDocument();
    expect(screen.getAllByText('Alice Reporter')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bob Assignee')[0]).toBeInTheDocument();
  });

  it('renders and allows updating issue type from sidebar', () => {
    renderWithProviders(
      <IssueDetailView
        issue={mockIssue}
        members={mockMembers}
        onUpdate={onUpdateMock}
      />
    );

    expect(screen.getByText('Type')).toBeInTheDocument();
    const selects = screen.getAllByTestId('mock-select');
    fireEvent.change(selects[0], { target: { value: 'BUG' } });
    expect(onUpdateMock).toHaveBeenCalledWith({ type: 'BUG' });
  });

  it('allows editing title and triggers onUpdate on blur/Enter', () => {
    renderWithProviders(
      <IssueDetailView
        issue={mockIssue}
        members={mockMembers}
        onUpdate={onUpdateMock}
      />
    );

    const titleHeading = screen.getByText('Test Issue Title');
    fireEvent.click(titleHeading);

    const titleInput = screen.getByDisplayValue('Test Issue Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Issue Title' } });
    fireEvent.blur(titleInput);

    expect(onUpdateMock).toHaveBeenCalledWith({ title: 'Updated Issue Title' });
  });

  it('allows editing description in plain-text textarea and saving changes', async () => {
    renderWithProviders(
      <IssueDetailView
        issue={mockIssue}
        members={mockMembers}
        onUpdate={onUpdateMock}
      />
    );

    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    const textarea = screen.getByPlaceholderText('Add a description...');
    expect(textarea).toHaveValue('Original description content');

    fireEvent.change(textarea, { target: { value: 'Updated description text' } });

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    expect(onUpdateMock).toHaveBeenCalledWith({ description: 'Updated description text' });
  });

  it('renders empty description placeholder when description is empty', () => {
    const emptyDescIssue = { ...mockIssue, description: '' };
    renderWithProviders(
      <IssueDetailView
        issue={emptyDescIssue}
        members={mockMembers}
        onUpdate={onUpdateMock}
      />
    );

    expect(screen.getByRole('button', { name: /add a description/i })).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    renderWithProviders(
      <IssueDetailView
        issue={mockIssue}
        members={mockMembers}
        onUpdate={onUpdateMock}
        canDelete={true}
        onDelete={onDeleteMock}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(onDeleteMock).toHaveBeenCalled();
  });
});
