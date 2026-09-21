import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api_helper';
import type { Issue, IssueFilters, IssueListResponse } from '../store/types';

export const getIssues = (projectId: string, filters: IssueFilters) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const query = params.toString();
  return apiGet<IssueListResponse>(`/projects/${projectId}/issues${query ? `?${query}` : ''}`);
};

export const getBoardIssues = (projectId: string) => apiGet<Issue[] | Record<string, Issue[]>>(`/projects/${projectId}/board`);

export const getIssue = (projectId: string, id: string) => apiGet<Issue>(`/projects/${projectId}/issues/${id}`);
export const createIssue = (projectId: string, data: Partial<Issue>) => apiPost<Issue>(`/projects/${projectId}/issues`, data);
export const createSubtask = (projectId: string, parentId: string, data: Partial<Issue>) => apiPost<Issue>(`/projects/${projectId}/issues/${parentId}/subtasks`, data);
export const updateIssue = (projectId: string, id: string, data: Partial<Issue>) => apiPatch<Issue>(`/projects/${projectId}/issues/${id}`, data);
export const moveIssue = (projectId: string, id: string, data: { status: string; beforeIssueId?: string | null; afterIssueId?: string | null }) => apiPatch<Issue>(`/projects/${projectId}/issues/${id}/move`, data);
export const deleteIssue = (projectId: string, id: string, force?: boolean) => apiDelete(`/projects/${projectId}/issues/${id}${force ? '?force=true' : ''}`);

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
  | 'COMMENT_DELETED';

export interface IssueActivity {
  id: string;
  issueId: string;
  actorId: string | null;
  actor: CommentAuthor;
  type: ActivityType;
  metadata: Record<string, any>;
  createdAt: string;
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
  apiGet<PaginatedResponse<Comment>>(`/projects/${projectId}/issues/${issueId}/comments?page=${page}&limit=${limit}`);

export const createComment = (projectId: string, issueId: string, content: string) =>
  apiPost<Comment>(`/projects/${projectId}/issues/${issueId}/comments`, { content });

export const updateComment = (projectId: string, issueId: string, commentId: string, content: string) =>
  apiPatch<Comment>(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`, { content });

export const deleteComment = (projectId: string, issueId: string, commentId: string) =>
  apiDelete(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`);

export const getActivities = (projectId: string, issueId: string, page = 1, limit = 20) =>
  apiGet<PaginatedResponse<IssueActivity>>(`/projects/${projectId}/issues/${issueId}/activity?page=${page}&limit=${limit}`);
