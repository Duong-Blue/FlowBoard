import { api } from '../utils/api_helper';
import type { Issue, IssueFilters, IssueListResponse } from '../store/types';

export const getIssues = (projectId: string, filters: IssueFilters) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
  if (filters.startDateFrom) params.append('startDateFrom', filters.startDateFrom);
  if (filters.startDateTo) params.append('startDateTo', filters.startDateTo);
  if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
  if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const query = params.toString();
  return api.get<IssueListResponse>(`/projects/${projectId}/issues${query ? `?${query}` : ''}`).then(res => res.data);
};

export const getBoardIssues = (projectId: string) => api.get<Issue[] | Record<string, Issue[]>>(`/projects/${projectId}/board`).then(res => res.data);

export const getIssue = (projectId: string, id: string) => api.get<Issue>(`/projects/${projectId}/issues/${id}`).then(res => res.data);
export const createIssue = (projectId: string, data: Partial<Issue>) => api.post<Issue>(`/projects/${projectId}/issues`, data).then(res => res.data);
export const createSubtask = (projectId: string, parentId: string, data: Partial<Issue>) => api.post<Issue>(`/projects/${projectId}/issues/${parentId}/subtasks`, data).then(res => res.data);
export const updateIssue = (projectId: string, id: string, data: Partial<Issue>) => api.patch<Issue>(`/projects/${projectId}/issues/${id}`, data).then(res => res.data);
export const moveIssue = (
  projectId: string,
  id: string,
  data: {
    status?: string;
    targetWorkflowStatusId?: string;
    beforeIssueId?: string | null;
    afterIssueId?: string | null;
  }
) => api.patch<Issue>(`/projects/${projectId}/issues/${id}/move`, data).then(res => res.data);
export const deleteIssue = (projectId: string, id: string, force?: boolean) => api.delete(`/projects/${projectId}/issues/${id}${force ? '?force=true' : ''}`).then(res => res.data);

export type CommentAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  avatarUrl?: string;
} | null;

export interface Comment {
  id: string;
  issueId: string;
  authorId: string | null;
  author: CommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'ISSUE_CREATED'
  | 'TITLE_CHANGED'
  | 'DESCRIPTION_CHANGED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'COMMENT_CREATED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_MEMBER_REMOVED'
  | 'ORG_MEMBER_ADDED'
  | 'ORG_MEMBER_REMOVED';

export interface IssueActivity {
  id: string;
  issueId: string;
  actorId: string | null;
  actor: CommentAuthor;
  type: ActivityType;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface Activity extends IssueActivity {
  entityType?: 'ISSUE' | 'PROJECT' | 'ORGANIZATION';
  projectId?: string;
  organizationId?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export const getComments = (projectId: string, issueId: string, page = 1, limit = 20) => 
  api.get<PaginatedResponse<Comment>>(`/projects/${projectId}/issues/${issueId}/comments?page=${page}&limit=${limit}`).then(res => res.data);

export const createComment = (projectId: string, issueId: string, content: string) =>
  api.post<Comment>(`/projects/${projectId}/issues/${issueId}/comments`, { content }).then(res => res.data);

export const updateComment = (projectId: string, issueId: string, commentId: string, content: string) =>
  api.patch<Comment>(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`, { content }).then(res => res.data);

export const deleteComment = (projectId: string, issueId: string, commentId: string) =>
  api.delete(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`).then(res => res.data);

export const getActivities = (projectId: string, issueId: string, page = 1, limit = 20) =>
  api.get<PaginatedResponse<IssueActivity>>(`/projects/${projectId}/issues/${issueId}/activity?page=${page}&limit=${limit}`).then(res => res.data);
