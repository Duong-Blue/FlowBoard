import { FlowBoardApiClient } from '../client/flowboard-api.client.js';
import { FlowBoardApiError } from '../client/flowboard-api.errors.js';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export class AuthContext {
  private user: UserProfile | null = null;
  private error: string | null = null;

  constructor(private apiClient: FlowBoardApiClient) {}

  async initialize(): Promise<void> {
    if (!this.apiClient.hasToken()) {
      this.error = "Missing credentials: No FLOWBOARD_API_TOKEN configured";
      return;
    }

    try {
      this.user = await this.apiClient.request<UserProfile>('/users/me');
      this.error = null;
    } catch (err: any) {
      if (err instanceof FlowBoardApiError && err.status === 401) {
        this.error = "Authentication failed: Invalid token (401)";
      } else {
        this.error = err?.message || "Authentication failed";
      }
      this.user = null;
    }
  }

  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  getUser(): UserProfile {
    if (!this.user) {
      throw new Error("User not authenticated");
    }
    return this.user;
  }

  getError(): string | null {
    return this.error;
  }
}
