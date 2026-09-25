import { createApi } from '@reduxjs/toolkit/query/react';
import { api } from '@/utils/api_helper';
import type { IssueStatus } from '../types';

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
  fromStatusId?: string | null;
  toStatusId: string;
  name?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workflow {
  id: string;
  projectId: string;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStatusPayload {
  name: string;
  category: IssueStatus;
  order?: number;
  color?: string;
}

export interface UpdateStatusPayload {
  name?: string;
  order?: number;
  color?: string;
}

export interface TransitionItemPayload {
  fromStatusId?: string | null;
  toStatusId: string;
}

const axiosBaseQuery =
  () =>
  async ({
    url,
    method,
    data,
    params,
  }: {
    url: string;
    method: string;
    data?: unknown;
    params?: unknown;
  }) => {
    try {
      const response = await api({ url, method, data, params });
      return { data: response.data };
    } catch (axiosError: any) {
      return {
        error: {
          status: axiosError.status || axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message || 'An error occurred',
        },
      };
    }
  };

export const workflowsApi = createApi({
  reducerPath: 'workflowsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Workflow'],
  endpoints: (builder) => ({
    getWorkflow: builder.query<Workflow, string>({
      query: (projectId) => ({
        url: `/projects/${projectId}/workflows`,
        method: 'GET',
      }),
      providesTags: (_res, _err, projectId) => [{ type: 'Workflow', id: projectId }],
    }),

    createStatus: builder.mutation<WorkflowStatus, { projectId: string; data: CreateStatusPayload }>({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/workflows/statuses`,
        method: 'POST',
        data,
      }),
      invalidatesTags: (_res, _err, { projectId }) => [{ type: 'Workflow', id: projectId }],
    }),

    updateStatus: builder.mutation<WorkflowStatus, { projectId: string; statusId: string; data: UpdateStatusPayload }>({
      query: ({ projectId, statusId, data }) => ({
        url: `/projects/${projectId}/workflows/statuses/${statusId}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: (_res, _err, { projectId }) => [{ type: 'Workflow', id: projectId }],
    }),

    deleteStatus: builder.mutation<WorkflowStatus, { projectId: string; statusId: string; fallbackStatusId: string }>({
      query: ({ projectId, statusId, fallbackStatusId }) => ({
        url: `/projects/${projectId}/workflows/statuses/${statusId}`,
        method: 'DELETE',
        params: { fallbackStatusId },
      }),
      invalidatesTags: (_res, _err, { projectId }) => [{ type: 'Workflow', id: projectId }],
    }),

    updateTransitionsMatrix: builder.mutation<WorkflowTransition[], { projectId: string; transitions: TransitionItemPayload[] }>({
      query: ({ projectId, transitions }) => ({
        url: `/projects/${projectId}/workflows/transitions/matrix`,
        method: 'PUT',
        data: { transitions },
      }),
      invalidatesTags: (_res, _err, { projectId }) => [{ type: 'Workflow', id: projectId }],
    }),
  }),
});

export const {
  useGetWorkflowQuery,
  useCreateStatusMutation,
  useUpdateStatusMutation,
  useDeleteStatusMutation,
  useUpdateTransitionsMatrixMutation,
} = workflowsApi;
