const getApiBase = (): string => {
  let url = import.meta.env.VITE_API_URL as string | undefined;
  if (!url || url.trim() === '') {
    console.warn('VITE_API_URL is not set. Falling back to default endpoints.');
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      url = 'https://skilltrack-backend-0fsr.onrender.com/api';
    } else {
      url = 'http://localhost:5000/api';
    }
  }
  url = url.trim().replace(/\/$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE = getApiBase();

interface RequestOptions extends RequestInit {
  token?: string | null;
  body?: any;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, body, headers, ...customConfig } = options;
  
  const authToken = token !== undefined ? token : localStorage.getItem('token');
  
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> || {})
  };

  if (authToken) {
    reqHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: reqHeaders,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let errorMsg = data.message || data.error;
      if (!errorMsg) {
        if (res.status === 401) errorMsg = 'Invalid official email or password.';
        else if (res.status === 403) errorMsg = 'Access forbidden: Insufficient privileges.';
        else if (res.status === 500) errorMsg = 'Server is temporarily unavailable. Please try again.';
        else errorMsg = `Request failed with status ${res.status}`;
      }
      throw new ApiError(errorMsg, res.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new ApiError('Unable to connect to the authentication server. Please check your internet connection or try again.', 0);
    }
    throw new ApiError(err.message || 'Network connection failed', 0);
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
