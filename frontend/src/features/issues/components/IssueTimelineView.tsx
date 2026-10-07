// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  User,
  CalendarDays,
  Clock3,
  Minus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store';
import type { Issue } from '@/store/types';
import { cn } from '@/lib/utils'; // Assuming cn is available for conditional class names

export interface IssueTimelineViewProps {
  issues?: Issue[];
  onIssueClick?: (issueId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-slate-200 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_PREVIEW: 'bg-amber-100 text-amber-800 border-amber-300',
  DONE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-slate-100 text-slate-600' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-50 text-blue-600' },
  HIGH: { label: 'High', className: 'bg-orange-50 text-orange-600' },
  URGENT: { label: 'Urgent', className: 'bg-red-50 text-red-600' },
};

export const IssueTimelineView: React.FC<IssueTimelineViewProps> = ({
  issues: propsIssues,
  onIssueClick,
}) => {
  const { t } = useTranslation('issues');
  const navigate = useNavigate();
  const location = useLocation();
  const { orgId } = useParams<{ orgId?: string }>();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const reduxIssues = useAppSelector((state) => state.issue.list);
  const boardColumns = useAppSelector((state) => state.issue.board.columns);

  const currentOrgId = orgId || activeOrgId || '';

  // Use provided issues, then Redux list, then board columns as fallback
  const allIssues = useMemo(() => {
    if (propsIssues && propsIssues.length > 0) return propsIssues;
    if (reduxIssues && reduxIssues.length > 0) return reduxIssues;
    // Flatten board columns, ensuring no duplicates if possible (though unlikely with typical API structure)
    const flatIssues = Object.values(boardColumns).flat();
    // Basic de-duplication by ID if needed, though ideally API response is clean
    const uniqueIssuesMap = new Map<string, Issue>();
    flatIssues.forEach(issue => uniqueIssuesMap.set(issue.id, issue));
    return Array.from(uniqueIssuesMap.values());
  }, [propsIssues, reduxIssues, boardColumns]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [zoomMode, setZoomMode] = useState<'days' | 'weeks'>('days');

  const daysWindow = zoomMode === 'days' ? 28 : 56; // Show 28 days or 56 days (8 weeks)

  const timelineStartDate = useMemo(() => {
    const d = new Date(currentDate);
    // Center the view around currentDate
    d.setDate(d.getDate() - Math.floor(daysWindow / 2));
    d.setHours(0, 0, 0, 0); // Start of the day
    return d;
  }, [currentDate, daysWindow]);

  // Generate list of dates for the timeline header
  const dateHeaderList = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < daysWindow; i++) {
      const d = new Date(timelineStartDate);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, [timelineStartDate, daysWindow]);

  const handlePrev = () => {
    const modifier = zoomMode === 'days' ? 14 : 28; // Go back 2 weeks or 4 weeks
    const d = new Date(currentDate);
    d.setDate(d.getDate() - modifier);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const modifier = zoomMode === 'days' ? 14 : 28; // Go forward 2 weeks or 4 weeks
    const d = new Date(currentDate);
    d.setDate(d.getDate() + modifier);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectIssue = (issue: Issue) => {
    if (onIssueClick) {
      onIssueClick(issue.id);
    } else {
      const projectKey = issue.projectKey || issue.project?.key || issue.projectId;
      if (currentOrgId && projectKey) {
        navigate(`/workspace/orgs/${currentOrgId}/projects/${projectKey}/work/issues/${issue.id}${location.search}`);
      } else {
        // Fallback for cases where orgId or projectKey might be missing
        navigate(`issues/${issue.id}`);
      }
    }
  };

  // Calculates the position and width of the issue bar on the timeline
  const getTimelineBarProps = (issue: Issue) => {
    const startTime = issue.startDate
      ? new Date(issue.startDate).getTime()
      : issue.createdAt
        ? new Date(issue.createdAt).getTime()
        : timelineStartDate.getTime(); // Default to start of timeline if no dates

    let endTime = issue.dueDate
      ? new Date(issue.dueDate).getTime()
      : startTime + 7 * 24 * 60 * 60 * 1000; // Default to 7 days after start if no due date

    // Ensure end time is not before start time
    if (endTime < startTime) {
      endTime = startTime + 24 * 60 * 60 * 1000; // Default to 1 day duration if due date is before start
    }

    const windowStartTime = timelineStartDate.getTime();
    const windowEndTime = timelineStartDate.getTime() + daysWindow * 24 * 60 * 60 * 1000;

    // Clamp issue times to the visible window
    const visibleStartTime = Math.max(startTime, windowStartTime);
    const visibleEndTime = Math.min(endTime, windowEndTime);

    // Calculate percentage for positioning and width
    const leftPercent = Math.max(
      0, // Ensure it doesn't go below 0%
      ((visibleStartTime - windowStartTime) / (windowEndTime - windowStartTime)) * 100
    );

    // Ensure a minimum width for visibility, even if the issue falls completely within a single day/hour slot
    const widthPercent = Math.max(
      1, // Minimum 1% width to be visible
      ((visibleEndTime - visibleStartTime) / (windowEndTime - windowStartTime)) * 100
    );

    return { leftPercent, widthPercent, start: new Date(startTime), end: new Date(endTime) };
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      {/* Timeline Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="h-8 text-xs font-medium">
            {t('timeline.today', { defaultValue: 'Today' })}
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-sm font-semibold text-slate-800 ml-2">
            {timelineStartDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} -{' '}
            {dateHeaderList[dateHeaderList.length - 1]?.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5 bg-slate-100 text-xs font-medium">
            <button
              type="button"
              onClick={() => setZoomMode('days')}
              className={cn(
                'px-2.5 py-1 rounded transition-colors',
                zoomMode === 'days'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Days
            </button>
            <button
              type="button"
              onClick={() => setZoomMode('weeks')}
              className={cn(
                'px-2.5 py-1 rounded transition-colors',
                zoomMode === 'weeks'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Weeks
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      <div className="flex-1 overflow-auto flex min-h-[400px]">
        {/* Left Sidebar: Issue Names */}
        <div className="w-64 sm:w-72 shrink-0 border-r border-slate-200 bg-white z-10 sticky left-0 shadow-sm">
          <div className="h-10 px-4 border-b border-slate-200 bg-slate-50 flex items-center font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Issue Key & Title
          </div>
          <div className="divide-y divide-slate-100">
            {allIssues.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">No issues to display</div>
            ) : (
              allIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => handleSelectIssue(issue)}
                  className="h-12 px-4 flex items-center gap-2 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <span className="font-mono text-xs font-semibold text-indigo-600 shrink-0">
                    {issue.key}
                  </span>
                  <span className="text-xs text-slate-800 font-medium truncate group-hover:text-indigo-600">
                    {issue.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Timeline Grid */}
        <div className="flex-1 min-w-[700px] relative">
          {/* Header Dates */}
          <div className="h-10 border-b border-slate-200 bg-slate-50 flex sticky top-0 z-10">
            {dateHeaderList.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={idx}
                  style={{ width: `${100 / daysWindow}%` }}
                  className={cn(
                    `flex flex-col items-center justify-center border-r border-slate-200/60 text-[10px]`,
                    isToday
                      ? 'bg-indigo-50 font-bold text-indigo-700'
                      : isWeekend
                        ? 'bg-slate-100/50 text-slate-400'
                        : 'text-slate-600'
                  )}
                >
                  <span>{day.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                  <span className="leading-none">{day.getDate()}</span>
                </div>
              );
            })}
          </div>

          {/* Timeline Bars Area */}
          <div className="relative divide-y divide-slate-100">
            {/* Today Indicator Vertical Line */}
            {(() => {
              const todayIndex = dateHeaderList.findIndex(
                (d) => d.toDateString() === new Date().toDateString()
              );
              if (todayIndex !== -1) {
                // Calculate position based on the start of the day + half a day for centering
                const todayLeft = ((todayIndex + 0.5) / daysWindow) * 100;
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                    style={{ left: `${todayLeft}%` }}
                  />
                );
              }
              return null;
            })()}

            {allIssues.map((issue) => {
              const { leftPercent, widthPercent, start, end } = getTimelineBarProps(issue);
              const statusBg = STATUS_COLORS[issue.status] || STATUS_COLORS.TODO;
              const priorityInfo = PRIORITY_BADGES[issue.priority] || PRIORITY_BADGES.MEDIUM;

              return (
                <div key={issue.id} className="h-12 relative flex items-center">
                  {/* Background Grid Vertical Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {dateHeaderList.map((day, idx) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <div
                          key={idx}
                          style={{ width: `${100 / daysWindow}%` }}
                          className={cn(
                            `border-r border-slate-100 h-full`,
                            isWeekend ? 'bg-slate-50/40' : ''
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Gantt Bar */}
                  <div
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    onClick={() => handleSelectIssue(issue)}
                    className={cn(
                      `absolute h-7 rounded-md border px-2 flex items-center justify-between gap-1 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md`,
                      statusBg
                    )}
                    title={`${issue.key}: ${issue.title} (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-semibold truncate leading-tight">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {issue.assignee && (
                        <span className="text-[10px] opacity-80" title={issue.assignee.displayName || issue.assignee.email}>
                          <User className="h-3 w-3 inline" />
                        </span>
                      )}
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${priorityInfo.className}`}>
                        {priorityInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueTimelineView;
