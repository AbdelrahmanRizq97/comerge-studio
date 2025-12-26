import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { getSupabaseClient } from '../supabase';
import { log } from '../../logger';
import { BASE_URL } from './baseUrl';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retried?: boolean;
  }
}

export const createApiClient = (baseURL: string): AxiosInstance => {
  const apiClient = axios.create({
    baseURL,
    timeout: 3 * 60 * 1000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  const maskAuthHeader = (headers: unknown) => {
    if (!headers || typeof headers !== 'object') return headers;
    const copy: Record<string, unknown> = { ...(headers as any) };
    const auth = (copy.Authorization ?? copy.authorization) as unknown;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      copy.Authorization = 'Bearer [REDACTED]';
    }
    return copy;
  };

  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (accessToken) {
          config.headers = config.headers ?? {};
          (config.headers).Authorization = `Bearer ${accessToken}`;
        }
      } catch (err) {
        log.warn('Failed to attach auth token to request', err);
      }

      log.debug('Request:', {
        url: config.url,
        method: config.method,
        headers: maskAuthHeader(config.headers),
        data: config.data,
      });
      return config;
    },
    (error: AxiosError) => {
      log.error('Request Error:', error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      log.debug('Response:', {
        url: response.config?.url,
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | (InternalAxiosRequestConfig & { _retried?: boolean })
        | undefined;
      log.error('Response Error:', {
        message: error.message,
        code: error.code,
        url: originalRequest?.url,
        method: originalRequest?.method,
        requestHeaders: maskAuthHeader(originalRequest?.headers),
        requestData: originalRequest?.data,
        status: error.response?.status,
        statusText: (error.response as any)?.statusText,
        responseHeaders: error.response?.headers,
        responseData: error.response?.data,
      });

      if (!originalRequest) {
        return Promise.reject(error);
      }

      const authHeader = (originalRequest.headers as any)?.Authorization as string | undefined;
      const hasBearerToken = Boolean(authHeader && authHeader.startsWith('Bearer '));

      if (error.response?.status === 401 && hasBearerToken && !originalRequest._retried) {
        originalRequest._retried = true;
        try {
          const supabase = getSupabaseClient();
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          const newToken = data.session?.access_token;
          if (newToken && originalRequest.headers) {
            (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
          return apiClient(originalRequest);
        } catch (refreshErr) {
          log.warn('Token refresh failed', refreshErr);
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
};

export const api = createApiClient(BASE_URL);

export default createApiClient;


