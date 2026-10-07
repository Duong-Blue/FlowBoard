import { FlowBoardApiClient } from '../flowboard-api.client.js';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  issueSequence: number;
}


export class ProjectsAdapter {
  constructor(private readonly client: FlowBoardApiClient) {}

  async list(orgId: string): Promise<Project[]> {
    return this.client.request<Project[]>(`/organizations/${orgId}/projects`);
  }

  async get(orgId: string, projectId: string): Promise<Project> {
    return this.client.request<Project>(`/organizations/${orgId}/projects/${projectId}`);
  }

  async getSummary(orgId: string, projectId: string): Promise<any> {
    return this.client.request<any>(`/organizations/${orgId}/projects/${projectId}/summary`);
  }
}
