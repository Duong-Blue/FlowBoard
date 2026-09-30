import { MilestoneStatus } from '@prisma/client';

export class MilestoneResponseDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  startDate: Date | null;
  targetDate: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  totalIssues: number;
  completedIssues: number;
}
