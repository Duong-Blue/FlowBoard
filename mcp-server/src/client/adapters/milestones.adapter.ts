import { FlowBoardApiClient } from '../flowboard-api.client.js';

export type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: MilestoneStatus;
  startDate?: string;
  targetDate?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  totalIssues?: number;
  completedIssues?: number;
}

export interface CreateMilestoneInput {
  name: string;
  description?: string;
  status?: MilestoneStatus;
  startDate?: string;
  targetDate?: string;
  order?: number;
}

export class MilestonesAdapter {
  constructor(private readonly client: FlowBoardApiClient) {}

  async list(projectId: string): Promise<Milestone[]> {
    return this.client.request<Milestone[]>(`/projects/${projectId}/milestones`);
  }

  async get(projectId: string, id: string): Promise<Milestone> {
    return this.client.request<Milestone>(`/projects/${projectId}/milestones/${id}`);
  }

  async create(projectId: string, input: CreateMilestoneInput): Promise<Milestone> {
    return this.client.request<Milestone>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async assignIssues(projectId: string, milestoneId: string, issueIds: string[]): Promise<{ updated: number }> {
    return this.client.request<{ updated: number }>(`/projects/${projectId}/milestones/${milestoneId}/issues`, {
      method: 'POST',
      body: JSON.stringify({ issueIds }),
    });
  }
}
