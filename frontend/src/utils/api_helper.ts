import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';

const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  envUrl = envUrl.replace(/\/$/, '');
  if (!envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/api`;
  }
  return envUrl;
};

export const api: AxiosInstance = axios.create({
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

const setHeader = (headers: any, name: string, value: string) => {
  if (!headers) return;
  if (typeof headers.set === 'function') {
    headers.set(name, value);
  } else {
    headers[name] = value;
  }
};

const getHeader = (headers: any, name: string): string | undefined => {
  if (!headers) return undefined;
  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(name.toLowerCase()) || undefined;
  }
  return headers[name] || headers[name.toLowerCase()] || undefined;
};

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

const doRefreshToken = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    clearAuthStorage();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return null;
  }

  isRefreshing = true;

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
      { refreshToken },
    );
    if (store && data.accessToken && data.user) {
      store.dispatch({
        type: 'auth/setCredentials',
        payload: { user: data.user, accessToken: data.accessToken },
      });
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    processQueue(null, data.accessToken);
    return data.accessToken;
  } catch (refreshError) {
    processQueue(refreshError, null);
    clearAuthStorage();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

api.interceptors.request.use(async (config) => {
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

  let token = store?.getState()?.auth?.accessToken;
  const isAuthEndpoint = config.url?.includes('/auth/');

  if (!token && !isAuthEndpoint) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      if (isRefreshing) {
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).catch(() => null);
        token = store?.getState()?.auth?.accessToken;
      } else {
        try {
          token = await doRefreshToken();
        } catch {
        }
      }
    }
  }

  if (token && config.headers) {
    setHeader(config.headers, 'Authorization', `Bearer ${token}`);
  }

  const mutationMethods = ['post', 'put', 'patch', 'delete'];
  if (config.method && mutationMethods.includes(config.method.toLowerCase()) && config.headers) {
    setHeader(config.headers, 'X-Correlation-ID', crypto.randomUUID());
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const requestAuthHeader = getHeader(originalRequest.headers, 'Authorization');
      const requestToken = requestAuthHeader?.replace('Bearer ', '');
      const currentToken = store?.getState()?.auth?.accessToken;

      if (requestToken && currentToken && requestToken !== currentToken) {
        if (originalRequest.headers) setHeader(originalRequest.headers, 'Authorization', `Bearer ${currentToken}`);
        return api(originalRequest);
      }

      originalRequest._retry = true;

      try {
        const newToken = await doRefreshToken();
        if (newToken && originalRequest.headers) {
          setHeader(originalRequest.headers, 'Authorization', `Bearer ${newToken}`);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    const serverMessage = (error.response?.data as { message?: string | string[] })?.message;
    if (serverMessage) {
      const formatted = Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage;
      const customError: any = new Error(formatted);
      customError.status = error.response?.status;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    return Promise.reject(error);
  },
);

export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => api.get<T>(url, config).then((res) => res.data);
export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => api.post<T>(url, data, config).then((res) => res.data);
export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => api.patch<T>(url, data, config).then((res) => res.data);
export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => api.delete<T>(url, config).then((res) => res.data);
