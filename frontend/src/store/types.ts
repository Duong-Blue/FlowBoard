import { store } from './index';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  theme?: string;
  language?: string;
  isActive?: boolean;
  createdAt?: string;
  hasPassword?: boolean;
  oauthProviders?: string[];
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  role?: string;
  projectCount?: number;
  memberCount?: number;
  _count?: {
    projects?: number;
    members?: number;
  };
}

export interface Project {
  id: string;
  organizationId: string;
  orgId?: string;
  name: string;
  key?: string;
  status?: string;
  description?: string;
  issueCount?: number;
  memberCount?: number;
  _count?: {
    issues?: number;
    members?: number;
  };
  organizationName?: string;
  organization?: {
    id: string;
    name: string;
    slug?: string;
  };
  lastAccessedAt?: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName?: string | null;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  orgId: string;
  expiresAt?: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  declinedAt?: string | null;
}

export interface IssueUser {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  avatarUrl?: string;
}

export type IssueType = 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_PREVIEW' | 'DONE';
export type DeadlineState = 'NO_DUE_DATE' | 'COMPLETED' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';
export type RelationType = 'BLOCKS' | 'IS_BLOCKED_BY' | 'BLOCKED_BY' | 'RELATES_TO' | 'DUPLICATES';

export interface WorkflowStatus {
  id: string;
  workflowId: string;
  name: string;
  category: IssueStatus;
  order: number;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowTransition {
  id: string;
  workflowId: string;
  fromStatusId: string;
  toStatusId: string;
  name?: string | null;
  createdAt?: string;
}

export interface Workflow {
  id: string;
  projectId: string;
  name?: string | null;
  isDefault?: boolean;
  statuses: WorkflowStatus[];
  transitions?: WorkflowTransition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface IssueRelation {
  id: string;
  sourceIssueId: string;
  targetIssueId: string;
  type: RelationType;
  createdAt: string;
  sourceIssue?: Partial<Issue>;
  targetIssue?: Partial<Issue>;
}

export interface SubtaskProgress {
  total: number;
  completed: number;
}

export interface Issue {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description?: string;
  status: IssueStatus | string;
  workflowStatusId?: string | null;
  workflowStatus?: WorkflowStatus;
  type?: IssueType | string;
  priority: string;
  assigneeId?: string;
  reporterId?: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string | null;
  deadlineState?: DeadlineState;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: IssueUser;
  reporter?: IssueUser;
  subtasks?: Issue[];
  subtaskMetrics?: SubtaskProgress | null;
  relations?: IssueRelation[];
  attachments?: Attachment[];
  orgId?: string;
  projectKey?: string;
  projectName?: string;
  project?: {
    id?: string;
    key?: string;
    name?: string;
    organizationId?: string;
    orgId?: string;
  };
}

export interface MoveIssuePayload {
  issueId: string;
  sourceStatus: IssueStatus | string;
  targetStatus: IssueStatus | string;
  targetWorkflowStatusId?: string;
  beforeIssueId: string | null;
  afterIssueId: string | null;
}

export interface IssueFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  overdue?: boolean;
  dueSoon?: boolean;
  noDueDate?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  startDateFrom?: string;
  startDateTo?: string;
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

export type NotificationType = 'ISSUE_ASSIGNED' | 'COMMENT_MENTION' | 'PROJECT_MEMBER_ADDED';
export const NotificationType = {
  ISSUE_ASSIGNED: 'ISSUE_ASSIGNED',
  COMMENT_MENTION: 'COMMENT_MENTION',
  PROJECT_MEMBER_ADDED: 'PROJECT_MEMBER_ADDED',
} as const;


export interface NotificationActor {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface NotificationProject {
  id: string;
  name: string;
  key: string;
}

export interface NotificationIssue {
  id: string;
  title: string;
  key: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  issueId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
  actor?: NotificationActor | null;
  project?: NotificationProject | null;
  issue?: NotificationIssue | null;
}

export type SearchEntityType = 'ISSUE' | 'PROJECT' | 'USER';

export interface SearchFilters {
  orgId?: string;
  projectId?: string;
  workflowStatusId?: string;
  statusCategory?: string;
  priority?: string;
  issueType?: string;
  assigneeId?: string;
  reporterId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'priority' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchSuggestionsParams {
  q: string;
  orgId?: string;
  projectId?: string;
  limit?: number;
}

export interface SearchQueryParams extends SearchFilters {
  q?: string;
  type?: SearchEntityType;
  cursor?: string;
  limit?: number;
}

export interface SearchIssueItem {
  id: string;
  title: string;
  key: string;
  projectId: string;
  projectKey?: string;
  projectName?: string;
  orgId?: string;
  workflowStatus?: {
    id: string;
    name: string;
    category: string;
    color?: string | null;
  } | null;
  type?: string;
  priority?: string;
  assignee?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
}

export interface SearchProjectItem {
  id: string;
  name: string;
  key: string;
  organizationId: string;
}

export interface SearchUserItem {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface SearchSuggestionsResponse {
  exactMatch: SearchIssueItem | null;
  issues: SearchIssueItem[];
  projects: SearchProjectItem[];
  users: SearchUserItem[];
}

export interface SearchResponse<T = SearchIssueItem | SearchProjectItem | SearchUserItem> {
  items: T[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}


