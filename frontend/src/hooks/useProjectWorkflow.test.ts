import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { workflowsApi } from '@/store/api/workflowsApi';
import { api } from '@/utils/api_helper';
import { useProjectWorkflow, DEFAULT_CATEGORY_COLORS } from './useProjectWorkflow';

vi.mock('@/utils/api_helper', () => ({
  api: vi.fn(),
}));

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

describe('useProjectWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles missing or null projectId gracefully with safe fallbacks', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useProjectWorkflow(null), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.workflow).toBeUndefined();
    expect(result.current.statuses).toEqual([]);
    expect(result.current.getStatusById('status-1')).toBeUndefined();
    expect(result.current.getStatusColor('status-1')).toBe('#6B7280');
    expect(result.current.getStatusColor('status-1', '#ff0000')).toBe('#ff0000');
    expect(result.current.getDefaultStatusId('TODO')).toBeUndefined();
    expect(result.current.getAllowedTransitions('status-1')).toEqual([]);
  });

  it('fetches workflow and sorts statuses by order ascending', async () => {
    const mockWorkflow = {
      id: 'wf-1',
      projectId: 'proj-1',
      statuses: [
        { id: 's3', workflowId: 'wf-1', name: 'Done', category: 'DONE' as const, order: 3, color: '#bbf7d0' },
        { id: 's1', workflowId: 'wf-1', name: 'To Do', category: 'TODO' as const, order: 1, color: '#e2e8f0' },
        { id: 's2', workflowId: 'wf-1', name: 'In Progress', category: 'IN_PROGRESS' as const, order: 2, color: null },
      ],
      transitions: [],
    };

    vi.mocked(api).mockResolvedValueOnce({ data: mockWorkflow });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectWorkflow('proj-1'), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(3);
    });

    expect(result.current.statuses.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    expect(result.current.workflow).toEqual(mockWorkflow);
  });

  it('retrieves status by ID correctly with getStatusById', async () => {
    const mockWorkflow = {
      id: 'wf-1',
      projectId: 'proj-1',
      statuses: [
        { id: 's1', workflowId: 'wf-1', name: 'To Do', category: 'TODO' as const, order: 0, color: '#e2e8f0' },
        { id: 's2', workflowId: 'wf-1', name: 'In Progress', category: 'IN_PROGRESS' as const, order: 1, color: '#bfdbfe' },
      ],
      transitions: [],
    };

    vi.mocked(api).mockResolvedValueOnce({ data: mockWorkflow });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectWorkflow('proj-1'), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(2);
    });

    expect(result.current.getStatusById('s2')).toEqual(mockWorkflow.statuses[1]);
    expect(result.current.getStatusById('invalid-id')).toBeUndefined();
    expect(result.current.getStatusById(null)).toBeUndefined();
  });

  it('resolves status colors correctly with getStatusColor', async () => {
    const mockWorkflow = {
      id: 'wf-1',
      projectId: 'proj-1',
      statuses: [
        { id: 's1', workflowId: 'wf-1', name: 'To Do', category: 'TODO' as const, order: 0, color: '#custom-color' },
        { id: 's2', workflowId: 'wf-1', name: 'In Progress', category: 'IN_PROGRESS' as const, order: 1, color: null },
      ],
      transitions: [],
    };

    vi.mocked(api).mockResolvedValueOnce({ data: mockWorkflow });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectWorkflow('proj-1'), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(2);
    });

    // Custom color set on status
    expect(result.current.getStatusColor('s1')).toBe('#custom-color');

    // No custom color set on status -> falls back to category color (IN_PROGRESS -> #bfdbfe)
    expect(result.current.getStatusColor('s2')).toBe(DEFAULT_CATEGORY_COLORS.IN_PROGRESS);

    // Explicit fallback color overrides category default when status has no color
    expect(result.current.getStatusColor('s2', '#fallback')).toBe('#fallback');

    // Unknown status ID -> uses fallback or default #6B7280
    expect(result.current.getStatusColor('unknown-id', '#fallback')).toBe('#fallback');
    expect(result.current.getStatusColor('unknown-id')).toBe('#6B7280');
  });

  it('returns correct default status ID by category with getDefaultStatusId', async () => {
    const mockWorkflow = {
      id: 'wf-1',
      projectId: 'proj-1',
      statuses: [
        { id: 's1', workflowId: 'wf-1', name: 'To Do', category: 'TODO' as const, order: 0 },
        { id: 's2', workflowId: 'wf-1', name: 'In Progress', category: 'IN_PROGRESS' as const, order: 1 },
        { id: 's3', workflowId: 'wf-1', name: 'Done', category: 'DONE' as const, order: 2 },
      ],
      transitions: [],
    };

    vi.mocked(api).mockResolvedValueOnce({ data: mockWorkflow });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectWorkflow('proj-1'), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(3);
    });

    expect(result.current.getDefaultStatusId('DONE')).toBe('s3');
    expect(result.current.getDefaultStatusId('TODO')).toBe('s1');
    // Default argument is 'TODO'
    expect(result.current.getDefaultStatusId()).toBe('s1');
    // Category not found -> fallback to first status (order 0 -> s1)
    expect(result.current.getDefaultStatusId('IN_PREVIEW')).toBe('s1');
  });

  it('validates transition matrix in getAllowedTransitions', async () => {
    const mockWorkflow = {
      id: 'wf-1',
      projectId: 'proj-1',
      statuses: [
        { id: 's1', workflowId: 'wf-1', name: 'To Do', category: 'TODO' as const, order: 0 },
        { id: 's2', workflowId: 'wf-1', name: 'In Progress', category: 'IN_PROGRESS' as const, order: 1 },
        { id: 's3', workflowId: 'wf-1', name: 'Done', category: 'DONE' as const, order: 2 },
      ],
      transitions: [
        { id: 't1', workflowId: 'wf-1', fromStatusId: 's1', toStatusId: 's2' },
        { id: 't2', workflowId: 'wf-1', fromStatusId: 's2', toStatusId: 's3' },
      ],
    };

    vi.mocked(api).mockResolvedValueOnce({ data: mockWorkflow });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectWorkflow('proj-1'), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(3);
    });

    // s1 only transitions to s2
    const allowedFromS1 = result.current.getAllowedTransitions('s1');
    expect(allowedFromS1.map((s) => s.id)).toEqual(['s2']);

    // s2 only transitions to s3
    const allowedFromS2 = result.current.getAllowedTransitions('s2');
    expect(allowedFromS2.map((s) => s.id)).toEqual(['s3']);

    // s3 has no transition rules defined -> fallback cleanly to all statuses
    const allowedFromS3 = result.current.getAllowedTransitions('s3');
    expect(allowedFromS3.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
  });

  it('falls back cleanly to all statuses in getAllowedTransitions when no transitions matrix is defined', async () => {
    const mockWorkflow = {
      id: 'wf-1',
      projectId: 'proj-1',
      statuses: [
        { id: 's1', workflowId: 'wf-1', name: 'To Do', category: 'TODO' as const, order: 0 },
        { id: 's2', workflowId: 'wf-1', name: 'In Progress', category: 'IN_PROGRESS' as const, order: 1 },
      ],
      transitions: [],
    };

    vi.mocked(api).mockResolvedValueOnce({ data: mockWorkflow });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectWorkflow('proj-1'), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(2);
    });

    expect(result.current.getAllowedTransitions('s1').map((s) => s.id)).toEqual(['s1', 's2']);
  });
});
