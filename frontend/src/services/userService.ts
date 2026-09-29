import { apiGet, apiPatch, apiPost, apiDelete } from '../utils/api_helper';
import type { User } from '../store/types';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  bio?: string | null;
  theme?: string;
  language?: string;
}

export const getUserProfile = () => apiGet<User>('/users/me');

export const getOauthProviders = () => apiGet<string[]>('/users/me/oauth');

export const changePassword = (data: any) => apiPatch<{ success: boolean }>('/users/me/password', data);

export const setPassword = (data: any) => apiPost<{ success: boolean }>('/users/me/password', data);

export const updateUserProfile = (data: UpdateProfilePayload) =>
  apiPatch<User>('/users/me', data);

export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<{ avatarUrl: string }>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAvatar = () => apiDelete<{ avatarUrl: null }>('/users/me/avatar');
