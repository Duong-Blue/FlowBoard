import { api } from '../utils/api_helper';
import type { User } from '../store/types';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  bio?: string | null;
  theme?: string;
  language?: string;
}

export const getUserProfile = () => api.get<User>('/users/me').then(res => res.data);

export const getOauthProviders = () => api.get<string[]>('/users/me/oauth').then(res => res.data);

export const changePassword = (data: any) => api.patch<{ success: boolean }>('/users/me/password', data).then(res => res.data);

export const setPassword = (data: any) => api.post<{ success: boolean }>('/users/me/password', data).then(res => res.data);

export const updateUserProfile = (data: UpdateProfilePayload) =>
  api.patch<User>('/users/me', data).then(res => res.data);

export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};

export const deleteAvatar = () => api.delete<{ avatarUrl: null }>('/users/me/avatar').then(res => res.data);
