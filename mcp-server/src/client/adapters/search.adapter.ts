import { FlowBoardApiClient } from '../flowboard-api.client.js';

export type SearchEntityType = 'ISSUE' | 'PROJECT' | 'USER';

export type SearchSortBy = 'relevance' | 'createdAt' | 'updatedAt' | 'priority' | 'dueDate';
export type SearchSortOrder = 'asc' | 'desc';

export interface SearchQuery {
  q?: string;
  orgId?: string;
  projectId?: string;
  type?: SearchEntityType;
  workflowStatusId?: string;
  statusCategory?: string;
  priority?: string;
  issueType?: string;
  assigneeId?: string;
  reporterId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  cursor?: string;
  limit?: number;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
}

export interface SearchResponse<T = any> {
  items: T[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

export interface SearchSuggestionsQuery {
  q: string;
  orgId?: string;
  projectId?: string;
  limit?: number;
}

export interface SearchSuggestionsResponse {
  exactMatch: any | null;
  issues: any[];
  projects: any[];
  users: any[];
}

export class SearchAdapter {
  constructor(private readonly client: FlowBoardApiClient) {}

  async search<T = any>(query: SearchQuery): Promise<SearchResponse<T>> {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }

    const queryString = params.toString();
    const path = queryString ? `/search?${queryString}` : '/search';

    return this.client.request<SearchResponse<T>>(path);
  }

  async getSuggestions(query: SearchSuggestionsQuery): Promise<SearchSuggestionsResponse> {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }

    const queryString = params.toString();
    const path = queryString ? `/search/suggestions?${queryString}` : '/search/suggestions';

    return this.client.request<SearchSuggestionsResponse>(path);
  }
}
