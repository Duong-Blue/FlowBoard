import { apiPost } from '../utils/api_helper';

export const forgotPassword = (data: { email: string }) =>
  apiPost<{ message: string }>('/auth/forgot-password', data);

export const verifyResetCode = (data: { email: string; code: string }) =>
  apiPost<{ resetToken: string }>('/auth/verify-reset-code', data);

export const resetPassword = (data: { resetToken: string; newPassword: string }) =>
  apiPost<{ message: string }>('/auth/reset-password', data);

