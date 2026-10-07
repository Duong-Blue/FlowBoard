import { FlowBoardApiError } from './flowboard-api.errors.js';

export class FlowBoardApiClient {
  private baseUrl: string;
  private tokenGetter: () => string | Promise<string>;

  constructor(baseUrl: string, tokenGetter: () => string | Promise<string>) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.tokenGetter = tokenGetter;
  }

  hasToken(): boolean {
    const token = this.tokenGetter();
    if (typeof token === 'string') {
      return !!token;
    }
    // For async getters, we assume true until actual request resolves it
    // because we can't block synchronously here.
    return true;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.tokenGetter();
    if (!token) {
      throw new Error("Missing credentials: No FLOWBOARD_API_TOKEN configured");
    }

    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`);
    const base = new URL(this.baseUrl);
    if (url.origin !== base.origin) {
      throw new Error("Security Error: Arbitrary proxying is not allowed. Target must match FLOWBOARD_API_URL origin.");
    }

    const headers = new Headers(options.headers);
    headers.delete('authorization');
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const headersRecord: Record<string, string> = {};
    headers.forEach((value, key) => {
      headersRecord[key] = value;
    });

    const response = await fetch(url.toString(), {
      ...options,
      signal: options.signal || AbortSignal.timeout(10000),
      headers: headersRecord,
    });

    if (!response.ok) {
      let details = null;
      if (typeof response.json === 'function') {
        details = await response.json().catch(() => null);
      }
      let code = 'API_ERROR';
      switch (response.status) {
        case 400: code = 'BAD_REQUEST'; break;
        case 401: code = 'UNAUTHORIZED'; break;
        case 403: code = 'FORBIDDEN'; break;
        case 404: code = 'NOT_FOUND'; break;
        case 409: code = 'CONFLICT'; break;
        case 422: code = 'UNPROCESSABLE_ENTITY'; break;
        case 429: code = 'TOO_MANY_REQUESTS'; break;
        default:
          if (response.status >= 500) code = 'SERVER_ERROR';
      }
      throw new FlowBoardApiError(response.status, code, details, `API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
