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
    _retryCount?: number;
    skipRetry?: boolean;
  }
}

const RETRYABLE_MAX_ATTEMPTS = 3;
const RETRYABLE_BASE_DELAY_MS = 500;
const RETRYABLE_MAX_DELAY_MS = 4000;
const RETRYABLE_JITTER_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(e: unknown): boolean {
  const err = e as any;
  const code = typeof err?.code === 'string' ? err.code : '';
  const message = typeof err?.message === 'string' ? err.message : '';

  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') return true;
  if (message.toLowerCase().includes('network error')) return true;
  if (message.toLowerCase().includes('timeout')) return true;

  const status = typeof err?.response?.status === 'number' ? err.response.status : undefined;
  if (status && (status === 429 || status >= 500)) return true;

  return false;
}

function computeBackoffDelay(attempt: number): number {
  const exp = Math.min(RETRYABLE_MAX_DELAY_MS, RETRYABLE_BASE_DELAY_MS * Math.pow(2, attempt - 1));
  const jitter = Math.floor(Math.random() * RETRYABLE_JITTER_MS);
  return exp + jitter;
}

function parseRetryAfterMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const seconds = Number(trimmed);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds * 1000;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  const delta = parsed - Date.now();
  return delta > 0 ? delta : 0;
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
        | (InternalAxiosRequestConfig & { _retried?: boolean; _retryCount?: number; skipRetry?: boolean })
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

      const method = originalRequest.method?.toLowerCase() ?? '';
      const isGet = method === 'get';
      const retryable = isRetryableNetworkError(error);
      const retryCount = originalRequest._retryCount ?? 0;
      const skipRetry = originalRequest.skipRetry === true;

      if (isGet && retryable && !skipRetry && retryCount < RETRYABLE_MAX_ATTEMPTS) {
        const retryAfterMs = parseRetryAfterMs(error.response?.headers?.['retry-after']);
        originalRequest._retryCount = retryCount + 1;
        const delayMs = retryAfterMs ?? computeBackoffDelay(retryCount + 1);
        log.warn('Retrying GET request after transient error', {
          url: originalRequest.url,
          attempt: originalRequest._retryCount,
          delayMs,
        });
        await sleep(delayMs);
        return apiClient(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
};

export const api = createApiClient(BASE_URL);

export default createApiClient;


