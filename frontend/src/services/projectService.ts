import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api_helper';
import type { Project } from '../store/types';

export const getProjects = (orgId: string) => apiGet<Project[]>(`/organizations/${orgId}/projects`);
export const createProject = (orgId: string, data: Partial<Project>) => apiPost<Project>(`/organizations/${orgId}/projects`, data);
export const getProject = (id: string) => apiGet<Project>(`/projects/${id}`);
export const updateProject = (id: string, data: Partial<Project>) => apiPatch<Project>(`/projects/${id}`, data);
export const deleteProject = (id: string) => apiDelete(`/projects/${id}`);
