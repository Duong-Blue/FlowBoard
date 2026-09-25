import { useMemo, useCallback } from 'react';
import {
  useGetWorkflowQuery,
  type Workflow,
  type WorkflowStatus,
} from '@/store/api/workflowsApi';
import type { IssueStatus } from '@/store/types';

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  TODO: '#e2e8f0',
  IN_PROGRESS: '#bfdbfe',
  IN_PREVIEW: '#fef08a',
  DONE: '#bbf7d0',
};

export interface UseProjectWorkflowResult {
  workflow?: Workflow;
  statuses: WorkflowStatus[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  getStatusById: (statusId?: string | null) => WorkflowStatus | undefined;
  getStatusColor: (statusId?: string | null, fallbackColor?: string) => string;
  getDefaultStatusId: (category?: IssueStatus | string) => string | undefined;
  getAllowedTransitions: (fromStatusId?: string | null) => WorkflowStatus[];
}

export function useProjectWorkflow(
  projectId?: string | null,
): UseProjectWorkflowResult {
  const { data: workflow, isLoading, isError, error } = useGetWorkflowQuery(
    projectId ?? '',
    { skip: !projectId },
  );

  const statuses = useMemo(() => {
    if (!workflow?.statuses) return [];
    return [...workflow.statuses].sort((a, b) => a.order - b.order);
  }, [workflow?.statuses]);

  const getStatusById = useCallback(
    (statusId?: string | null): WorkflowStatus | undefined => {
      if (!statusId) return undefined;
      return statuses.find((s) => s.id === statusId);
    },
    [statuses],
  );

  const getStatusColor = useCallback(
    (statusId?: string | null, fallbackColor?: string): string => {
      const status = getStatusById(statusId);
      if (status?.color) return status.color;
      if (fallbackColor) return fallbackColor;
      if (status?.category && DEFAULT_CATEGORY_COLORS[status.category]) {
        return DEFAULT_CATEGORY_COLORS[status.category];
      }
      return '#6B7280';
    },
    [getStatusById],
  );

  const getDefaultStatusId = useCallback(
    (category: IssueStatus | string = 'TODO'): string | undefined => {
      const matchingStatus = statuses.find((s) => s.category === category);
      if (matchingStatus) return matchingStatus.id;
      return statuses[0]?.id;
    },
    [statuses],
  );

  const getAllowedTransitions = useCallback(
    (fromStatusId?: string | null): WorkflowStatus[] => {
      if (statuses.length === 0) return [];
      if (!workflow?.transitions || workflow.transitions.length === 0) {
        return statuses;
      }

      const matchingTransitions = workflow.transitions.filter((t) =>
        fromStatusId ? t.fromStatusId === fromStatusId : t.fromStatusId == null,
      );

      if (matchingTransitions.length === 0) {
        return statuses;
      }

      const allowedTargetIds = new Set(
        matchingTransitions.map((t) => t.toStatusId),
      );
      return statuses.filter((s) => allowedTargetIds.has(s.id));
    },
    [workflow?.transitions, statuses],
  );

  return {
    workflow,
    statuses,
    isLoading,
    isError,
    error,
    getStatusById,
    getStatusColor,
    getDefaultStatusId,
    getAllowedTransitions,
  };
}
