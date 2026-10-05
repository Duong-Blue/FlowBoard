import { api } from '../utils/api_helper';
import type { Organization } from '../store/types';

export const getOrgs = () => api.get<Organization[]>('/organizations').then(res => res.data);
export const createOrg = (data: Partial<Organization>) => api.post<Organization>('/organizations', data).then(res => res.data);
export const getOrg = (id: string) => api.get<Organization>(`/organizations/${id}`).then(res => res.data);
export const updateOrg = (id: string, data: Partial<Organization>) => api.patch<Organization>(`/organizations/${id}`, data).then(res => res.data);
export const deleteOrg = (id: string) => api.delete(`/organizations/${id}`).then(res => res.data);
