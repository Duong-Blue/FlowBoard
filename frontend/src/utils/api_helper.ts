import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';

const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  envUrl = envUrl.replace(/\/$/, '');
  if (!envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/api`;
  }
  return envUrl;
};

const api: AxiosInstance = axios.create({
  baseURL: getApiUrl(),
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
  if (config.url) {
    let cleanUrl = config.url;
    if (cleanUrl.startsWith('/api/')) {
      cleanUrl = cleanUrl.replace(/^\/api/, '');
    } else if (cleanUrl.startsWith('api/')) {
      cleanUrl = cleanUrl.replace(/^api/, '');
    }
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = `/${cleanUrl}`;
    }
    config.url = cleanUrl;
  }

  const token = store?.getState()?.auth?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const mutationMethods = ['post', 'put', 'patch', 'delete'];
  if (config.method && mutationMethods.includes(config.method.toLowerCase())) {
    config.headers['X-Correlation-ID'] = crypto.randomUUID();
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

    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`, { refreshToken });
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

    const serverMessage = (error.response?.data as { message?: string | string[] })?.message;
    if (serverMessage) {
      const formatted = Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage;
      return Promise.reject(new Error(formatted));
    }
    return Promise.reject(error);
  }
);

export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => api.get<T>(url, config).then((res) => res.data);
export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => api.post<T>(url, data, config).then((res) => res.data);
export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => api.patch<T>(url, data, config).then((res) => res.data);
export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => api.delete<T>(url, config).then((res) => res.data);
