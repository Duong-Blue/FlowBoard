import { api } from '../utils/api_helper';
import type { Invitation } from '../store/types';

export const getInvitations = (orgId: string) => api.get<Invitation[]>(`/organizations/${orgId}/invitations`).then(res => res.data);
export const sendInvitation = (orgId: string, data: { email: string, role: string }) => api.post<Invitation>(`/organizations/${orgId}/invitations`, data).then(res => res.data);
export const revokeInvitation = (orgId: string, invitationId: string) => api.delete(`/organizations/${orgId}/invitations/${invitationId}`).then(res => res.data);
export const acceptInvitation = (orgId: string, token: string) => api.post(`/organizations/${orgId}/invitations/accept`, { token }).then(res => res.data);
export const declineInvitation = (orgId: string, token: string) => api.post(`/organizations/${orgId}/invitations/decline`, { token }).then(res => res.data);

export const getMyInvitations = () => api.get<Invitation[]>('/users/me/invitations').then(res => res.data);
