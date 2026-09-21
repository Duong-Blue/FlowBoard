import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api_helper';

export interface SavedView {
  id: string;
  projectId: string;
  createdById: string;
  name: string;
  filterJson: Record<string, any>;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewPayload {
  name: string;
  filterJson: Record<string, any>;
  isShared?: boolean;
}

export interface UpdateSavedViewPayload {
  name?: string;
  filterJson?: Record<string, any>;
  isShared?: boolean;
}

export const getSavedViews = (projectId: string) =>
  apiGet<SavedView[]>(`/projects/${projectId}/saved-views`);

export const getSavedView = (projectId: string, id: string) =>
  apiGet<SavedView>(`/projects/${projectId}/saved-views/${id}`);

export const createSavedView = (projectId: string, data: CreateSavedViewPayload) =>
  apiPost<SavedView>(`/projects/${projectId}/saved-views`, data);

export const updateSavedView = (projectId: string, id: string, data: UpdateSavedViewPayload) =>
  apiPatch<SavedView>(`/projects/${projectId}/saved-views/${id}`, data);

export const deleteSavedView = (projectId: string, id: string) =>
  apiDelete(`/projects/${projectId}/saved-views/${id}`);
