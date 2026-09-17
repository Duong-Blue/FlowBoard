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
    moveCardOptimistic: (state, action: PayloadAction<MoveIssuePayload>) => {
      // Create deep copy of previous state
      state.board.previousBoardState = JSON.parse(JSON.stringify(state.board.columns));
      
      const { issueId, sourceStatus, targetStatus, beforeIssueId, afterIssueId } = action.payload;
      
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
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardIssues.pending, (state) => {
        state.board.loading = true;
      })
      .addCase(fetchBoardIssues.fulfilled, (state, action) => {
        state.board.loading = false;
        
        state.board.columns = {
          TODO: [],
          IN_PROGRESS: [],
          IN_PREVIEW: [],
          DONE: []
        };
        
        action.payload.forEach(issue => {
          const status = issue.status as keyof BoardColumns;
          if (state.board.columns[status]) {
            state.board.columns[status].push(issue);
          } else {
            state.board.columns.TODO.push(issue);
          }
        });
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
  rollbackMove
} = issueSlice.actions;

export default issueSlice.reducer;