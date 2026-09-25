import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useBoardRealtime } from './useBoardRealtime';
import { useSocketContext } from '../providers/SocketProvider';
import { fetchBoardIssues } from '../store/slices/issueSlice';
import { workflowsApi } from '../store/api/workflowsApi';

vi.mock('../providers/SocketProvider', () => ({
  useSocketContext: vi.fn(),
}));

vi.mock('../store/slices/issueSlice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store/slices/issueSlice')>();
  return {
    ...actual,
    fetchBoardIssues: vi.fn((projectId: string) => ({ type: 'issue/fetchBoardIssues', payload: projectId })),
    reconcileBoardIssue: vi.fn(),
  };
});

function createTestStore() {
  return configureStore({
    reducer: {
      [workflowsApi.reducerPath]: workflowsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(workflowsApi.middleware),
  });
}

function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store: store as any, children });
  };
}

describe('useBoardRealtime', () => {
  let mockSocket: any;

  beforeEach(() => {
    vi.clearAllMocks();

    const handlers: Record<string, Function> = {};
    mockSocket = {
      emit: vi.fn(),
      on: vi.fn((event, handler) => {
        handlers[event] = handler;
      }),
      off: vi.fn(),
      __trigger: (event: string, data?: any) => {
        if (handlers[event]) {
          handlers[event](data);
        }
      },
    };

    vi.mocked(useSocketContext).mockReturnValue({
      socket: mockSocket,
      isConnected: true,
    } as any);
  });

  it('subscribes to project and listens for events including workflow.updated', () => {
    const store = createTestStore();
    renderHook(() => useBoardRealtime('proj-1'), {
      wrapper: createWrapper(store),
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:project', { projectId: 'proj-1' });
    expect(mockSocket.on).toHaveBeenCalledWith('workflow.updated', expect.any(Function));
  });

  it('invalidates workflow tags and fetches board issues when workflow.updated is triggered', () => {
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    renderHook(() => useBoardRealtime('proj-1'), {
      wrapper: createWrapper(store),
    });

    mockSocket.__trigger('workflow.updated', { eventId: 'evt-1', payload: { projectId: 'proj-1' } });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: `${workflowsApi.reducerPath}/invalidateTags`,
        payload: [{ type: 'Workflow', id: 'proj-1' }],
      }),
    );
    expect(fetchBoardIssues).toHaveBeenCalledWith('proj-1');
  });

  it('unsubscribes from events on unmount', () => {
    const store = createTestStore();
    const { unmount } = renderHook(() => useBoardRealtime('proj-1'), {
      wrapper: createWrapper(store),
    });

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe:project', { projectId: 'proj-1' });
    expect(mockSocket.off).toHaveBeenCalledWith('workflow.updated', expect.any(Function));
  });
});
