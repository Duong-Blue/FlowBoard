import { FlowBoardApiClient } from '../flowboard-api.client.js';

export interface CreateCommentParams {
  content: string;
}

export interface QueryCommentParams {
  page?: number;
  limit?: number;
}

export class CommentsAdapter {
  constructor(private client: FlowBoardApiClient) {}

  async list(projectId: string, issueId: string, query?: QueryCommentParams) {
    let url = `/projects/${projectId}/issues/${issueId}/comments`;
    if (query) {
      const params = new URLSearchParams();
      if (query.page !== undefined) params.append('page', query.page.toString());
      if (query.limit !== undefined) params.append('limit', query.limit.toString());
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.client.request<any>(url);
  }

  async create(projectId: string, issueId: string, data: CreateCommentParams) {
    return this.client.request<any>(`/projects/${projectId}/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
