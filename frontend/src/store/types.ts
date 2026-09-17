import { store } from './index';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  key?: string;
  status?: string;
  description?: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  orgId: string;
}

export interface IssueUser {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  avatarUrl?: string;
}

export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_PREVIEW' | 'DONE';

export interface Issue {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description?: string;
  status: IssueStatus | string;
  priority: string;
  assigneeId?: string;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: IssueUser;
  reporter?: IssueUser;
}

export interface MoveIssuePayload {
  issueId: string;
  sourceStatus: IssueStatus;
  targetStatus: IssueStatus;
  beforeIssueId: string | null;
  afterIssueId: string | null;
}

export interface IssueFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

export interface IssueListResponse {
  items: Issue[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
