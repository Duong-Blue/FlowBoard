import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api_helper';
import type { Project } from '../store/types';

export const getProjects = (orgId: string) => apiGet<Project[]>(`/organizations/${orgId}/projects`);
export const createProject = (orgId: string, data: Partial<Project>) => apiPost<Project>(`/organizations/${orgId}/projects`, data);
export const getProject = (orgId: string, idOrKey: string) => apiGet<Project>(`/organizations/${orgId}/projects/${idOrKey}`);
export const updateProject = (orgId: string, idOrKey: string, data: Partial<Project>) => apiPatch<Project>(`/organizations/${orgId}/projects/${idOrKey}`, data);
export const deleteProject = (orgId: string, idOrKey: string) => apiDelete(`/organizations/${orgId}/projects/${idOrKey}`);
