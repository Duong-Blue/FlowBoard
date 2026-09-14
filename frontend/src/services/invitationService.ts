import { apiGet, apiPost, apiDelete } from '../utils/api_helper';
import type { Invitation } from '../store/types';

export const getInvitations = (orgId: string) => apiGet<Invitation[]>(`/organizations/${orgId}/invitations`);
export const sendInvitation = (orgId: string, data: { email: string, role: string }) => apiPost<Invitation>(`/organizations/${orgId}/invitations`, data);
export const revokeInvitation = (orgId: string, invitationId: string) => apiDelete(`/organizations/${orgId}/invitations/${invitationId}`);
export const acceptInvitation = (orgId: string, token: string) => apiPost(`/organizations/${orgId}/invitations/accept`, { token });
