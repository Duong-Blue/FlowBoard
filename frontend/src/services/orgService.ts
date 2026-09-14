import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api_helper';
import type { Organization } from '../store/types';

export const getOrgs = () => apiGet<Organization[]>('/organizations');
export const createOrg = (data: Partial<Organization>) => apiPost<Organization>('/organizations', data);
export const getOrg = (id: string) => apiGet<Organization>(`/organizations/${id}`);
export const updateOrg = (id: string, data: Partial<Organization>) => apiPatch<Organization>(`/organizations/${id}`, data);
export const deleteOrg = (id: string) => apiDelete(`/organizations/${id}`);
