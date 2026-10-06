import React from 'react';
import type { Milestone } from '@/services/milestoneService';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoadmapTimelineProps {
  milestones: Milestone[];
  onSelectMilestone?: (milestone: Milestone) => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  milestones,
  onSelectMilestone,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'CLOSED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 gap-1">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 gap-1">
            <AlertCircle className="h-3 w-3" /> Planned
          </Badge>
        );
    }
  };

  return (
    <div className="relative py-4">
      {/* Horizontal timeline bar for desktop */}
      <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            onClick={() => onSelectMilestone?.(milestone)}
            className="cursor-pointer group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {milestone.name}
              </span>
              {getStatusBadge(milestone.status)}
            </div>

            {milestone.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {milestone.description}
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {milestone.targetDate
                    ? new Date(milestone.targetDate).toLocaleDateString()
                    : 'No target date'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
