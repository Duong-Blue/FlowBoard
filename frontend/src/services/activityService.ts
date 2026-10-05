import { api } from '../utils/api_helper';
import type { Activity, PaginatedResponse } from './issueService';

export const getProjectActivities = (
  projectId: string,
  page = 1,
  limit = 20,
) =>
  api.get<PaginatedResponse<Activity>>(
    `/projects/${projectId}/activity?page=${page}&limit=${limit}`,
  ).then(res => res.data);

export const getOrgActivities = (
  orgId: string,
  page = 1,
  limit = 20,
) =>
  api.get<PaginatedResponse<Activity>>(
    `/organizations/${orgId}/activity?page=${page}&limit=${limit}`,
  ).then(res => res.data);
