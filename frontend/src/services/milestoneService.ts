import { api } from '../utils/api_helper';
import type { IssueStatus, IssueType } from '@/store/types';
import { MilestoneStatus } from './types';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  startDate: Date | null;
  targetDate: Date | null;
  order: number;
  progress: number;
  totalIssues: number;
  completedIssues: number;
}

export interface MilestoneIssue {
  id: string;
  key: string | null;
  title: string;
  status: IssueStatus | string;
  priority: string;
  type: IssueType | string;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
}

export interface MilestoneDetail extends Milestone {
  issues: MilestoneIssue[];
}

export const milestoneService = {
  getAll: async (projectId: string): Promise<Milestone[]> => {
    const response = await api.get(`/projects/${projectId}/milestones`);
    return response.data;
  },
  getOne: async (projectId: string, id: string): Promise<MilestoneDetail> => {
    const response = await api.get(`/projects/${projectId}/milestones/${id}`);
    return response.data;
  },
  create: async (projectId: string, data: Partial<Milestone>): Promise<Milestone> => {
    const response = await api.post(`/projects/${projectId}/milestones`, data);
    return response.data;
  },
  update: async (projectId: string, id: string, data: Partial<Milestone>): Promise<Milestone> => {
    const response = await api.patch(`/projects/${projectId}/milestones/${id}`, data);
    return response.data;
  },
  delete: async (projectId: string, id: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/milestones/${id}`);
  },
  reorder: async (projectId: string, milestoneIds: string[]): Promise<void> => {
    await api.put(`/projects/${projectId}/milestones/reorder`, { milestoneIds });
  },
  assignIssues: async (projectId: string, id: string, issueIds: string[]): Promise<{ updated: number }> => {
    const response = await api.post(`/projects/${projectId}/milestones/${id}/issues`, { issueIds });
    return response.data;
  }
};
