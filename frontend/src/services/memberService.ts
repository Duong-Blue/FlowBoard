import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api_helper';
import type { Member } from '../store/types';

export const getOrgMembers = (orgId: string) => apiGet<Member[]>(`/organizations/${orgId}/members`);
export const updateOrgMemberRole = (orgId: string, memberId: string, role: string) => apiPatch(`/organizations/${orgId}/members/${memberId}`, { role });
export const removeOrgMember = (orgId: string, memberId: string) => apiDelete(`/organizations/${orgId}/members/${memberId}`);

export const getProjectMembers = (projectId: string) => apiGet<Member[]>(`/projects/${projectId}/members`);
export const addProjectMember = (projectId: string, data: { userId: string, role: string }) => apiPost(`/projects/${projectId}/members`, data);
export const updateProjectMemberRole = (projectId: string, memberId: string, role: string) => apiPatch(`/projects/${projectId}/members/${memberId}`, { role });
export const removeProjectMember = (projectId: string, memberId: string) => apiDelete(`/projects/${projectId}/members/${memberId}`);
