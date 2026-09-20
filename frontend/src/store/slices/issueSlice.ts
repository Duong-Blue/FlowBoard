import { api } from '@/utils/api_helper';
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type Issue, type IssueFilters, type MoveIssuePayload } from '../types';
import {
  getBoardIssues,
  getComments,
  createComment as apiCreateComment,
  updateComment as apiUpdateComment,
  deleteComment as apiDeleteComment,
  getActivities,
  type Comment,
  type IssueActivity,
  type PaginationMeta,
} from '../../services/issueService';

interface BoardColumns {
  TODO: Issue[];
  IN_PROGRESS: Issue[];
  IN_PREVIEW: Issue[];
  DONE: Issue[];
}

interface IssueState {
  list: Issue[];
  total: number;
  filters: IssueFilters;
  loading: boolean;
  error: string | null;
  board: {
    columns: BoardColumns;
    previousBoardState: BoardColumns | null;
    pendingCorrelationIds: string[];
    loading: boolean;
  };
  comments: {
    items: Comment[];
    meta: PaginationMeta;
    loading: boolean;
    error: string | null;
  };
  activities: {
    items: IssueActivity[];
    meta: PaginationMeta;
    loading: boolean;
    error: string | null;
  };
  isSubtasksLoading: boolean;
  isRelationsLoading: boolean;
  isAttachmentsLoading: boolean;
}

const initialBoardColumns: BoardColumns = {
  TODO: [],
  IN_PROGRESS: [],
  IN_PREVIEW: [],
  DONE: [],
};

const initialState: IssueState = {
  list: [],
  total: 0,
  filters: {
    page: 1,
    limit: 10,
  },
  loading: false,
  error: null,
  board: {
    columns: initialBoardColumns,
    previousBoardState: null,
    pendingCorrelationIds: [],
    loading: false,
  },
  comments: {
    items: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    loading: false,
    error: null,
  },
  activities: {
    items: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    loading: false,
    error: null,
  },
  isSubtasksLoading: false,
  isRelationsLoading: false,
  isAttachmentsLoading: false,
};

export const fetchBoardIssues = createAsyncThunk(
  'issue/fetchBoardIssues',
  async (projectId: string) => {
    return await getBoardIssues(projectId);
  }
);

export const fetchComments = createAsyncThunk(
  'issue/fetchComments',
  async ({ projectId, issueId, page, limit }: { projectId: string; issueId: string; page?: number; limit?: number }) => {
    return await getComments(projectId, issueId, page, limit);
  }
);

export const createComment = createAsyncThunk(
  'issue/createComment',
  async ({ projectId, issueId, content }: { projectId: string; issueId: string; content: string }) => {
    return await apiCreateComment(projectId, issueId, content);
  }
);

export const updateComment = createAsyncThunk(
  'issue/updateComment',
  async ({ projectId, issueId, commentId, content }: { projectId: string; issueId: string; commentId: string; content: string }) => {
    return await apiUpdateComment(projectId, issueId, commentId, content);
  }
);

export const deleteComment = createAsyncThunk(
  'issue/deleteComment',
  async ({ projectId, issueId, commentId }: { projectId: string; issueId: string; commentId: string }) => {
    await apiDeleteComment(projectId, issueId, commentId);
    return commentId;
  }
);

export const fetchActivities = createAsyncThunk(
  'issue/fetchActivities',
  async ({ projectId, issueId, page, limit }: { projectId: string; issueId: string; page?: number; limit?: number }) => {
    return await getActivities(projectId, issueId, page, limit);
  }
);

export const fetchSubtasks = createAsyncThunk(
  'issue/fetchSubtasks',
  async ({ projectId, issueId }: { projectId: string; issueId: string }) => {
    const response = await api.get(`/projects/${projectId}/issues/${issueId}/subtasks`);
    return response.data;
  }
);

export const createSubtask = createAsyncThunk(
  'issue/createSubtask',
  async ({ projectId, issueId, data }: { projectId: string; issueId: string; data: any }) => {
    const response = await api.post(`/projects/${projectId}/issues/${issueId}/subtasks`, data);
    return response.data;
  }
);

export const updateIssueStatus = createAsyncThunk(
  'issue/updateIssueStatus',
  async ({ projectId, issueId, status }: { projectId: string; issueId: string; status: string }) => {
    const response = await api.patch(`/projects/${projectId}/issues/${issueId}`, { status });
    return response.data;
  }
);

export const fetchRelations = createAsyncThunk(
  'issue/fetchRelations',
  async ({ projectId, issueId }: { projectId: string; issueId: string }) => {
    const response = await api.get(`/projects/${projectId}/issues/${issueId}/relations`);
    return response.data;
  }
);

export const createRelation = createAsyncThunk(
  'issue/createRelation',
  async ({ projectId, issueId, targetIssueId, type }: { projectId: string; issueId: string; targetIssueId: string; type: string }) => {
    const response = await api.post(`/projects/${projectId}/issues/${issueId}/relations`, { targetIssueId, type });
    return response.data;
  }
);

export const deleteRelation = createAsyncThunk(
  'issue/deleteRelation',
  async ({ projectId, issueId, relationId }: { projectId: string; issueId: string; relationId: string }) => {
    await api.delete(`/projects/${projectId}/issues/${issueId}/relations/${relationId}`);
    return relationId;
  }
);

export const fetchAttachments = createAsyncThunk(
  'issue/fetchAttachments',
  async ({ projectId, issueId }: { projectId: string; issueId: string }) => {
    const response = await api.get(`/projects/${projectId}/issues/${issueId}/attachments`);
    return response.data;
  }
);

export const uploadAttachment = createAsyncThunk(
  'issue/uploadAttachment',
  async ({ projectId, issueId, file }: { projectId: string; issueId: string; file: File }) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${projectId}/issues/${issueId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
);

export const deleteAttachment = createAsyncThunk(
  'issue/deleteAttachment',
  async ({ projectId, issueId, attachmentId }: { projectId: string; issueId: string; attachmentId: string }) => {
    await api.delete(`/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}`);
    return attachmentId;
  }
);

const issueSlice = createSlice({
  name: 'issue',
  initialState,
  reducers: {
    setIssues: (state, action: PayloadAction<{ items?: Issue[]; issues?: Issue[]; total: number }>) => {
      state.list = action.payload.items ?? action.payload.issues ?? [];
      state.total = action.payload.total;
    },
    addIssue: (state, action: PayloadAction<Issue>) => {
      state.list.unshift(action.payload);
      state.total += 1;
      
      const status = action.payload.status as keyof BoardColumns;
      if (state.board.columns[status]) {
        state.board.columns[status].push(action.payload);
      }
    },
    updateIssue: (state, action: PayloadAction<Issue>) => {
      const index = state.list.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...action.payload };
      }
    },
    removeIssue: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(i => i.id !== action.payload);
      state.total = Math.max(0, state.total - 1);
    },
    setFilters: (state, action: PayloadAction<Partial<IssueFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    moveCardOptimistic: (state, action: PayloadAction<MoveIssuePayload & { correlationId?: string }>) => {
      // Create deep copy of previous state
      state.board.previousBoardState = JSON.parse(JSON.stringify(state.board.columns));
      
      const { issueId, sourceStatus, targetStatus, beforeIssueId, afterIssueId, correlationId } = action.payload;
      if (correlationId) {
        if (!state.board.pendingCorrelationIds) {
          state.board.pendingCorrelationIds = [];
        }
        state.board.pendingCorrelationIds.push(correlationId);
      }
      
      const sourceCol = state.board.columns[sourceStatus];
      const targetCol = state.board.columns[targetStatus];
      
      const issueIndex = sourceCol.findIndex(i => i.id === issueId);
      if (issueIndex === -1) return;
      
      const [issue] = sourceCol.splice(issueIndex, 1);
      issue.status = targetStatus;
      
      if (beforeIssueId) {
        const targetIndex = targetCol.findIndex(i => i.id === beforeIssueId);
        targetCol.splice(targetIndex !== -1 ? targetIndex : 0, 0, issue);
      } else if (afterIssueId) {
        const targetIndex = targetCol.findIndex(i => i.id === afterIssueId);
        targetCol.splice(targetIndex !== -1 ? targetIndex + 1 : targetCol.length, 0, issue);
      } else {
        targetCol.push(issue);
      }
    },
    rollbackMove: (state) => {
      if (state.board.previousBoardState) {
        state.board.columns = state.board.previousBoardState;
        state.board.previousBoardState = null;
      }
    },
    reconcileBoardIssue: (
      state,
      action: PayloadAction<{ correlationId?: string; issue?: Partial<Issue> & { id: string } }>
    ) => {
      const { correlationId, issue } = action.payload;
      if (!issue || !issue.id) return;

      if (correlationId && state.board.pendingCorrelationIds?.includes(correlationId)) {
        state.board.pendingCorrelationIds = state.board.pendingCorrelationIds.filter(
          (id) => id !== correlationId
        );

        for (const colKey of Object.keys(state.board.columns) as (keyof BoardColumns)[]) {
          const col = state.board.columns[colKey];
          const item = col.find((i) => i.id === issue.id);
          if (item) {
            if (issue.updatedAt !== undefined) item.updatedAt = issue.updatedAt;
            if (issue.status !== undefined) item.status = issue.status;
            if (issue.title !== undefined) item.title = issue.title;
            break;
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardIssues.pending, (state) => {
        const hasData = Object.values(state.board.columns).some((col) => col.length > 0);
        if (!hasData) {
          state.board.loading = true;
        }
      })
      .addCase(fetchBoardIssues.fulfilled, (state, action) => {
        state.board.loading = false;
        
        const defaultColumns: BoardColumns = {
          TODO: [],
          IN_PROGRESS: [],
          IN_PREVIEW: [],
          DONE: []
        };
        
        if (Array.isArray(action.payload)) {
          state.board.columns = defaultColumns;
          action.payload.forEach(issue => {
            const status = issue.status as keyof BoardColumns;
            if (state.board.columns[status]) {
              state.board.columns[status].push(issue);
            } else {
              state.board.columns.TODO.push(issue);
            }
          });
        } else if (action.payload && typeof action.payload === 'object') {
          const payloadObj = action.payload as unknown as Record<string, Issue[]>;
          state.board.columns = {
            TODO: payloadObj.TODO || [],
            IN_PROGRESS: payloadObj.IN_PROGRESS || [],
            IN_PREVIEW: payloadObj.IN_PREVIEW || [],
            DONE: payloadObj.DONE || [],
          };
        } else {
          state.board.columns = defaultColumns;
        }
      })
      .addCase(fetchBoardIssues.rejected, (state, action) => {
        state.board.loading = false;
        state.error = action.error.message || 'Failed to fetch board issues';
      })
      .addCase(fetchComments.pending, (state) => {
        state.comments.loading = true;
        state.comments.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments.loading = false;
        state.comments.items = action.payload.items;
        state.comments.meta = action.payload.meta;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.comments.loading = false;
        state.comments.error = action.error.message || 'Failed to fetch comments';
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.comments.items.unshift(action.payload);
        state.comments.meta.total += 1;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.comments.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.comments.items[index] = action.payload;
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments.items = state.comments.items.filter((c) => c.id !== action.payload);
        state.comments.meta.total = Math.max(0, state.comments.meta.total - 1);
      })
      .addCase(fetchActivities.pending, (state) => {
        state.activities.loading = true;
        state.activities.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.activities.loading = false;
        state.activities.items = action.payload.items;
        state.activities.meta = action.payload.meta;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.activities.loading = false;
        state.activities.error = action.error.message || 'Failed to fetch activities';
      })
      .addCase(fetchSubtasks.pending, (state) => { state.isSubtasksLoading = true; })
      .addCase(fetchSubtasks.fulfilled, (state, action) => {
        state.isSubtasksLoading = false;
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue) {
          issue.subtasks = action.payload;
        }
      })
      .addCase(createSubtask.fulfilled, (state, action) => {
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue) {
          if (!issue.subtasks) issue.subtasks = [];
          issue.subtasks.push(action.payload);
        }
      })
      .addCase(updateIssueStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated || !updated.id) return;
        const index = state.list.findIndex(i => i.id === updated.id);
        if (index !== -1) {
          state.list[index] = { ...state.list[index], ...updated };
        }
        state.list.forEach(parent => {
          if (parent.subtasks) {
            const subIndex = parent.subtasks.findIndex(s => s.id === updated.id);
            if (subIndex !== -1) {
              parent.subtasks[subIndex] = { ...parent.subtasks[subIndex], ...updated };
            }
          }
        });
      })
      .addCase(fetchRelations.pending, (state) => { state.isRelationsLoading = true; })
      .addCase(fetchRelations.fulfilled, (state, action) => {
        state.isRelationsLoading = false;
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue) issue.relations = action.payload;
      })
      .addCase(createRelation.fulfilled, (state, action) => {
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue) {
          if (!issue.relations) issue.relations = [];
          issue.relations.push(action.payload);
        }
      })
      .addCase(deleteRelation.fulfilled, (state, action) => {
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue && issue.relations) {
          issue.relations = issue.relations.filter(r => r.id !== action.payload);
        }
      })
      .addCase(fetchAttachments.pending, (state) => { state.isAttachmentsLoading = true; })
      .addCase(fetchAttachments.fulfilled, (state, action) => {
        state.isAttachmentsLoading = false;
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue) issue.attachments = action.payload;
      })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue) {
          if (!issue.attachments) issue.attachments = [];
          issue.attachments.push(action.payload);
        }
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        const issue = state.list.find(i => i.id === action.meta.arg.issueId);
        if (issue && issue.attachments) {
          issue.attachments = issue.attachments.filter(a => a.id !== action.payload);
        }
      });
  }
});

export const { 
  setIssues, 
  addIssue, 
  updateIssue, 
  removeIssue, 
  setFilters, 
  setLoading, 
  setError,
  moveCardOptimistic,
  rollbackMove,
  reconcileBoardIssue
} = issueSlice.actions;

export default issueSlice.reducer;

