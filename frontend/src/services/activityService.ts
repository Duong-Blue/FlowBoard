import { apiGet } from '../utils/api_helper';
import type { Activity, PaginatedResponse } from './issueService';

export const getProjectActivities = (
  projectId: string,
  page = 1,
  limit = 20,
) =>
  apiGet<PaginatedResponse<Activity>>(
    `/projects/${projectId}/activity?page=${page}&limit=${limit}`,
  );

export const getOrgActivities = (
  orgId: string,
  page = 1,
  limit = 20,
) =>
  apiGet<PaginatedResponse<Activity>>(
    `/organizations/${orgId}/activity?page=${page}&limit=${limit}`,
  );
