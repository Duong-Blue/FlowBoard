export const MilestoneStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type MilestoneStatus = typeof MilestoneStatus[keyof typeof MilestoneStatus];
