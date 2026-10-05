import { api } from '../utils/api_helper';

export const forgotPassword = (data: { email: string }) =>
  api.post<{ message: string }>('/auth/forgot-password', data).then(res => res.data);

export const verifyResetCode = (data: { email: string; code: string }) =>
  api.post<{ resetToken: string }>('/auth/verify-reset-code', data).then(res => res.data);

export const resetPassword = (data: { resetToken: string; newPassword: string }) =>
  api.post<{ message: string }>('/auth/reset-password', data).then(res => res.data);

