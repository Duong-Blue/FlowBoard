import { api } from '../utils/api_helper';
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

export const milestoneService = {
  getAll: async (projectId: string): Promise<Milestone[]> => {
    const response = await api.get(`/projects/${projectId}/milestones`);
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
  }
};
