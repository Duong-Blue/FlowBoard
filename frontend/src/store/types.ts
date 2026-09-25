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
  reporterId: string;
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

