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

export type ApiEvent = 'backend:waking' | 'backend:ready' | 'backend:unreachable';
type EventCallback = () => void;

class ApiEventEmitter {
  private listeners: Record<ApiEvent, EventCallback[]> = {
    'backend:waking': [],
    'backend:ready': [],
    'backend:unreachable': []
  };

  on(event: ApiEvent, callback: EventCallback) {
    this.listeners[event].push(callback);
  }
  
  off(event: ApiEvent, callback: EventCallback) {
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: ApiEvent) {
    this.listeners[event].forEach(cb => cb());
  }
}

export const apiEvents = new ApiEventEmitter();

let isBackendReady = false;
let backendReadyPromise: Promise<void> | null = null;

export async function waitForBackend(): Promise<void> {
  if (isBackendReady) return Promise.resolve();
  if (backendReadyPromise) return backendReadyPromise;

  apiEvents.emit('backend:waking');
  
  backendReadyPromise = (async () => {
    const maxRetries = 5;
    const baseDelay = 1000;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          isBackendReady = true;
          apiEvents.emit('backend:ready');
          return;
        }
      } catch (err) {
        console.warn(`[Cold Start] Backend health check failed (Attempt ${attempt + 1}/${maxRetries + 1})`);
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(res => setTimeout(res, delay));
      }
    }
    
    apiEvents.emit('backend:unreachable');
    throw new Error('Unable to connect to the server.');
  })();
  
  return backendReadyPromise;
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
  
  const isHealthCheck = endpoint.includes('/health');
  
  if (!isHealthCheck) {
    await waitForBackend().catch(() => {
      throw new ApiError('Unable to connect to the server.', 0);
    });
  }

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

  const executeRequest = async (attempt = 0): Promise<T> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout per request
      
      const configWithSignal = { ...config, signal: controller.signal };
      const res = await fetch(url, configWithSignal);
      clearTimeout(timeoutId);
      
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status >= 502 && res.status <= 504 && attempt < 3 && !isHealthCheck) {
           const delay = 1000 * Math.pow(2, attempt);
           await new Promise(r => setTimeout(r, delay));
           return executeRequest(attempt + 1);
        }

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
      
      if ((err.name === 'TypeError' || err.name === 'AbortError') && attempt < 3 && !isHealthCheck) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        return executeRequest(attempt + 1);
      }

      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out.', 408);
      }
      throw new ApiError('Unable to connect to the server. Please check your internet connection or try again.', 0);
    }
  };

  return executeRequest();
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
