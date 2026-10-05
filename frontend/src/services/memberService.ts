import { api } from '../utils/api_helper';
import type { Member } from '../store/types';

export const getOrgMembers = (orgId: string) => api.get<Member[]>(`/organizations/${orgId}/members`).then(res => res.data);
export const updateOrgMemberRole = (orgId: string, memberId: string, role: string) => api.patch(`/organizations/${orgId}/members/${memberId}`, { role }).then(res => res.data);
export const removeOrgMember = (orgId: string, memberId: string) => api.delete(`/organizations/${orgId}/members/${memberId}`).then(res => res.data);

export const getProjectMembers = (projectId: string) => api.get<Member[]>(`/projects/${projectId}/members`).then(res => res.data);
export const addProjectMember = (projectId: string, data: { userId: string, role: string }) => api.post(`/projects/${projectId}/members`, data).then(res => res.data);
export const updateProjectMemberRole = (projectId: string, memberId: string, role: string) => api.patch(`/projects/${projectId}/members/${memberId}`, { role }).then(res => res.data);
export const removeProjectMember = (projectId: string, memberId: string) => api.delete(`/projects/${projectId}/members/${memberId}`).then(res => res.data);
