import { api } from '../utils/api_helper';
import type { Project } from '../store/types';

export const getProjects = (orgId: string) => api.get<Project[]>(`/organizations/${orgId}/projects`).then(res => res.data);
export const createProject = (orgId: string, data: Partial<Project>) => api.post<Project>(`/organizations/${orgId}/projects`, data).then(res => res.data);
export const getProject = (orgId: string, idOrKey: string) => api.get<Project>(`/organizations/${orgId}/projects/${idOrKey}`).then(res => res.data);
export const updateProject = (orgId: string, idOrKey: string, data: Partial<Project>) => api.patch<Project>(`/organizations/${orgId}/projects/${idOrKey}`, data).then(res => res.data);
export const deleteProject = (orgId: string, idOrKey: string) => api.delete(`/organizations/${orgId}/projects/${idOrKey}`).then(res => res.data);
export const getProjectSummary = (idOrKey: string) => api.get(`/projects/${idOrKey}/summary`).then(res => res.data);
