import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { NotificationItem } from '../types';
import { apiGet, apiPatch } from '../../utils/api_helper';

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  page: number;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,
  page: 1,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params: FetchNotificationsParams = {}) => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const unreadOnly = params.unreadOnly;
    return await apiGet<NotificationsResponse>('/notifications', {
      params: { page, limit, ...(unreadOnly !== undefined ? { unreadOnly } : {}) },
    });
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async () => {
    return await apiGet<{ count: number }>('/notifications/unread-count');
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markNotificationAsRead',
  async (id: string) => {
    return await apiPatch<NotificationItem>(`/notifications/${id}/read`);
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllNotificationsAsRead',
  async () => {
    return await apiPatch<{ count: number }>('/notifications/read-all');
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      // Avoid duplicate item if already present
      const exists = state.items.some((i) => i.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.loading = false;
      state.hasMore = true;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { items, meta } = action.payload;
        if (meta.page === 1) {
          state.items = items;
        } else {
          // Filter duplicates when appending next pages
          const existingIds = new Set(state.items.map((i) => i.id));
          const newItems = items.filter((i) => !existingIds.has(i.id));
          state.items.push(...newItems);
        }
        state.page = meta.page;
        state.hasMore = meta.page < meta.totalPages;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      // fetchUnreadCount
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count;
      })
      // markNotificationAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((i) => i.id === updated.id);
        if (index !== -1) {
          const wasUnread = !state.items[index].isRead;
          state.items[index] = { ...state.items[index], ...updated, isRead: true };
          if (wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items.forEach((item) => {
          item.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, setUnreadCount, clearNotifications } = notificationSlice.actions;

export default notificationSlice.reducer;
