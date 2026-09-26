import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getIssues } from '@/services/issueService';
import type { Issue } from '@/store/types';
import { useProjectWorkflow } from '@/hooks/useProjectWorkflow';

interface CalendarBoardProps {
  projectId: string;
  orgId: string;
  projectKey: string;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function CalendarBoard({ projectId, orgId, projectKey }: CalendarBoardProps) {
  const { t } = useTranslation('issues');
  const navigate = useNavigate();
  const { statuses, getStatusById, getStatusColor } = useProjectWorkflow(projectId);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate calendar grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { gridDays, startDateFrom, startDateTo } = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Start grid on Sunday (0) or Monday (1). Let's use Monday start (0=Sun, 1=Mon, ..., 6=Sat)
    let startDayOfWeek = firstOfMonth.getDay() - 1; // 0 for Mon, -1 for Sun
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes index 6

    const startDate = new Date(firstOfMonth);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const endDate = new Date(lastOfMonth);
    let endDayOfWeek = endDate.getDay() - 1;
    if (endDayOfWeek === -1) endDayOfWeek = 6;
    const daysToAdd = 6 - endDayOfWeek;
    endDate.setDate(endDate.getDate() + daysToAdd);

    const days: Date[] = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    return {
      gridDays: days,
      startDateFrom: formatDateKey(startDate),
      startDateTo: formatDateKey(endDate),
    };
  }, [year, month]);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    const fetchCalendarIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getIssues(projectId, {
          startDateFrom,
          startDateTo,
          limit: 100,
        });
        if (isMounted) {
          setIssues(res.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch calendar issues:', err);
        if (isMounted) {
          setError(t('common:status.error', { defaultValue: 'Failed to load calendar issues' }));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCalendarIssues();

    return () => {
      isMounted = false;
    };
  }, [projectId, startDateFrom, startDateTo, t]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleIssueClick = (issue: Issue) => {
    const issueKey = issue.key || issue.id;
    navigate(`/workspace/orgs/${orgId}/projects/${projectKey}/calendar/issues/${issueKey}`);
  };

  // Group issues by date grid cells
  const dayIssuesMap = useMemo(() => {
    const map: Record<string, Issue[]> = {};

    gridDays.forEach((day) => {
      const key = formatDateKey(day);
      map[key] = [];
    });

    issues.forEach((issue) => {
      const start = parseLocalDate(issue.startDate);
      const due = parseLocalDate(issue.dueDate);

      if (!start && !due) return;

      const issueStart = start || due!;
      const issueEnd = due || start!;

      gridDays.forEach((day) => {
        const key = formatDateKey(day);
        const dayTime = day.getTime();

        if (dayTime >= issueStart.getTime() && dayTime <= issueEnd.getTime()) {
          if (!map[key]) map[key] = [];
          map[key].push(issue);
        }
      });
    });

    return map;
  }, [gridDays, issues]);

  // Issues without any dates
  const unscheduledIssues = useMemo(() => {
    return issues.filter((issue) => !issue.startDate && !issue.dueDate);
  }, [issues]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const todayKey = formatDateKey(new Date());
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <CalendarIcon className="h-5 w-5 text-blue-600 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-500 hidden xs:inline">{t('board.calendarView', { defaultValue: 'Calendar' })}</span>
          <span className="text-slate-300 hidden xs:inline">•</span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize">{monthName}</h2>
          {loading && <span className="text-xs text-slate-500 animate-pulse ml-2">{t('common:status.loading', { defaultValue: 'Loading...' })}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs">
            {t('board.today', { defaultValue: 'Today' })}
          </Button>
          <div className="flex items-center border border-slate-200 rounded-md bg-white">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-r-none border-r border-slate-200">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-l-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs border-b border-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentDate(new Date(currentDate));
            }}
            className="h-6 text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Desktop Grid View (sm and larger) */}
      <div className="hidden sm:flex flex-1 flex-col overflow-y-auto">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center font-semibold text-xs text-slate-600 py-2.5">
          {weekDays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Date cells grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-200/40 min-h-[500px]">
          {gridDays.map((day) => {
            const dateKey = formatDateKey(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = dateKey === todayKey;
            const dayIssues = dayIssuesMap[dateKey] || [];

            return (
              <div
                key={dateKey}
                className={`min-h-[110px] p-1.5 flex flex-col transition-colors ${
                  isCurrentMonth ? 'bg-white' : 'bg-slate-50/70 text-slate-400'
                } ${isToday ? 'bg-blue-50/40' : ''}`}
              >
                {/* Date header */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <span
                    className={`text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayIssues.length > 0 && (
                    <span className="text-[10px] font-medium text-slate-400">
                      {dayIssues.length}
                    </span>
                  )}
                </div>

                {/* Day Issues List */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[140px] pr-0.5 no-scrollbar">
                  {dayIssues.map((issue) => {
                    const statusMeta = getStatusById(issue.workflowStatusId) || statuses.find(s => s.category === issue.status);
                    const statusName = statusMeta?.name || issue.workflowStatus?.name || issue.status;
                    const statusColor = statusMeta?.color || getStatusColor(issue.workflowStatusId || issue.status);

                    return (
                      <button
                        key={`${dateKey}-${issue.id}`}
                        type="button"
                        onClick={() => handleIssueClick(issue)}
                        className="w-full text-left p-1.5 rounded border text-xs shadow-2xs transition-all hover:scale-[1.01] bg-white border-slate-200 flex flex-col gap-1"
                        style={{
                          borderLeftWidth: '3px',
                          borderLeftColor: statusColor,
                        }}
                      >
                        <div className="font-medium truncate flex items-center gap-1">
                          <span className="font-mono text-[10px] opacity-75 shrink-0">{issue.key}</span>
                          <span className="truncate">{issue.title}</span>
                        </div>
                        <div className="flex items-center">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0"
                            style={{
                              backgroundColor: `${statusColor}18`,
                              color: statusColor,
                              borderColor: `${statusColor}40`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: statusColor }}
                            />
                            {statusName}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Agenda Fallback View (< 640px) */}
      <div className="flex sm:hidden flex-1 flex-col overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500 animate-pulse">
            {t('common:status.loading', { defaultValue: 'Loading calendar...' })}
          </div>
        ) : gridDays.filter(day => day.getMonth() === month && (dayIssuesMap[formatDateKey(day)] || []).length > 0).length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No issues scheduled for this month.
          </div>
        ) : (
          gridDays
            .filter(day => day.getMonth() === month && (dayIssuesMap[formatDateKey(day)] || []).length > 0)
            .map((day) => {
              const dateKey = formatDateKey(day);
              const dayIssues = dayIssuesMap[dateKey] || [];
              const isToday = dateKey === todayKey;
              return (
                <div key={dateKey} className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {day.getDate()}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayIssues.map((issue) => {
                      const statusMeta = getStatusById(issue.workflowStatusId) || statuses.find(s => s.category === issue.status);
                      const statusName = statusMeta?.name || issue.workflowStatus?.name || issue.status;
                      const statusColor = statusMeta?.color || getStatusColor(issue.workflowStatusId || issue.status);
                      return (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => handleIssueClick(issue)}
                          className="w-full text-left p-2 rounded border border-slate-200 hover:border-blue-300 bg-slate-50/50 flex flex-col gap-1 transition-colors"
                          style={{ borderLeftWidth: '4px', borderLeftColor: statusColor }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] text-slate-500 font-semibold">{issue.key}</span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                            >
                              {statusName}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-800 truncate">{issue.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Unscheduled Issues Drawer / Footer */}
      {unscheduledIssues.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Unscheduled Issues ({unscheduledIssues.length})</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {unscheduledIssues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => handleIssueClick(issue)}
                className="shrink-0 max-w-[200px] px-2.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-xs transition-colors text-left"
              >
                <div className="font-mono text-[10px] text-slate-500">{issue.key}</div>
                <div className="font-medium text-slate-800 truncate">{issue.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
