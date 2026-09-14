import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

let store: any;
export const injectStore = (_store: any) => {
  store = _store;
};

const clearAuthStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
};

api.interceptors.request.use((config) => {
  const token = store?.getState()?.auth?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/refresh`, { refreshToken });
        if (store && data.accessToken && data.user) {
          store.dispatch({ type: 'auth/setCredentials', payload: { user: data.user, accessToken: data.accessToken } });
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        processQueue(null, data.accessToken);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => api.get<T>(url, config).then((res) => res.data);
export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => api.post<T>(url, data, config).then((res) => res.data);
export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => api.patch<T>(url, data, config).then((res) => res.data);
export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => api.delete<T>(url, config).then((res) => res.data);
