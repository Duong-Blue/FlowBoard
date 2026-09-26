// @ts-nocheck
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import CreateProjectPage from './CreateProjectPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as projectService from '../../services/projectService';

const mockNavigate = vi.fn();

vi.mock('../../services/projectService', () => ({
  createProject: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orgId: 'org-123' }),
    useNavigate: () => mockNavigate,
  };
});

describe('CreateProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields including Textarea for description', () => {
    renderWithProviders(<CreateProjectPage />);

    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Key/i)).toBeInTheDocument();
    const descTextarea = screen.getByPlaceholderText('Brief summary of project goals...');
    expect(descTextarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('autogenerates key from project name and shows key preview', () => {
    renderWithProviders(<CreateProjectPage />);

    const nameInput = screen.getByLabelText(/Project Name/i);
    fireEvent.change(nameInput, { target: { value: 'My Super App' } });

    const keyInput = screen.getByLabelText(/Project Key/i);
    expect(keyInput.value).toBe('MSA');
    expect(screen.getByText('Key preview:')).toBeInTheDocument();
  });

  it('navigates back to project list when cancel is clicked', () => {
    renderWithProviders(<CreateProjectPage />);

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/org-123/projects');
  });

  it('submits valid form data', async () => {
    vi.mocked(projectService.createProject).mockResolvedValue({
      id: 'proj-1',
      key: 'TEST',
      name: 'Test Project',
      description: 'Test description',
      organizationId: 'org-123',
    });

    renderWithProviders(<CreateProjectPage />);

    const nameInput = screen.getByLabelText(/Project Name/i);
    const descTextarea = screen.getByPlaceholderText('Brief summary of project goals...');

    fireEvent.change(nameInput, { target: { value: 'Test Project' } });
    fireEvent.change(descTextarea, { target: { value: 'Test description' } });

    const submitBtn = screen.getByRole('button', { name: /Create Project/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(projectService.createProject).toHaveBeenCalledWith('org-123', {
        name: 'Test Project',
        key: 'TP',
        description: 'Test description',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/orgs/org-123/projects/TEST/issues');
  });
});
