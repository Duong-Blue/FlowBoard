import { api } from '../utils/api_helper';

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
  api.get<SavedView[]>(`/projects/${projectId}/saved-views`).then(res => res.data);

export const getSavedView = (projectId: string, id: string) =>
  api.get<SavedView>(`/projects/${projectId}/saved-views/${id}`).then(res => res.data);

export const createSavedView = (projectId: string, data: CreateSavedViewPayload) =>
  api.post<SavedView>(`/projects/${projectId}/saved-views`, data).then(res => res.data);

export const updateSavedView = (projectId: string, id: string, data: UpdateSavedViewPayload) =>
  api.patch<SavedView>(`/projects/${projectId}/saved-views/${id}`, data).then(res => res.data);

export const deleteSavedView = (projectId: string, id: string) =>
  api.delete(`/projects/${projectId}/saved-views/${id}`).then(res => res.data);
