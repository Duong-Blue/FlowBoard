import { FlowBoardApiClient } from '../flowboard-api.client.js';

export interface Issue {
  id: string;
  projectId: string;
  key: string | null;
  title: string;
  description: string | null;
  order: string;
  status: string;
  workflowStatusId: string | null;
  priority: string;
  type: string;
  assigneeId: string | null;
  reporterId: string | null;
  milestoneId: string | null;
  parentId: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueDto {
  title: string;
  description?: string;
  status?: string;
  workflowStatusId?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  parentId?: string;
  startDate?: string;
  dueDate?: string;
  milestoneId?: string;
}

export interface UpdateIssueDto extends Partial<CreateIssueDto> {}

export interface MoveIssueDto {
  status?: string;
  targetWorkflowStatusId?: string | null;
  beforeIssueId?: string | null;
  afterIssueId?: string | null;
}

export interface IssueQueryDto {
  search?: string;
  status?: string;
  workflowStatusId?: string;
  milestoneId?: string;
  priority?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  overdue?: boolean;
  dueSoon?: boolean;
  noDueDate?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedIssues {
  items: Issue[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class IssuesAdapter {
  constructor(private readonly client: FlowBoardApiClient) {}

  async list(projectId: string, query?: IssueQueryDto): Promise<PaginatedIssues> {
    const searchParams = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/projects/${projectId}/issues${queryString ? `?${queryString}` : ''}`;
    
    return this.client.request<PaginatedIssues>(endpoint);
  }

  async get(projectId: string, issueId: string): Promise<Issue> {
    return this.client.request<Issue>(`/projects/${projectId}/issues/${issueId}`);
  }

  async create(projectId: string, data: CreateIssueDto): Promise<Issue> {
    return this.client.request<Issue>(`/projects/${projectId}/issues`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(projectId: string, issueId: string, data: UpdateIssueDto): Promise<Issue> {
    return this.client.request<Issue>(`/projects/${projectId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async move(projectId: string, issueId: string, data: MoveIssueDto): Promise<Issue> {
    return this.client.request<Issue>(`/projects/${projectId}/issues/${issueId}/move`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
