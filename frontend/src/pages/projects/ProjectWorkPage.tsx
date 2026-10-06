import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  LayoutList,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageLoader } from '@/components/shared/PageLoader';
import NotFound from '../NotFound';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { useProjectWorkflow, DEFAULT_CATEGORY_COLORS } from '@/hooks/useProjectWorkflow';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFilters, setIssues, addIssue, setLoading, setError, fetchBoardIssues } from '@/store/slices/issueSlice';
import { getIssues, createIssue } from '@/services/issueService';
import { getProjectMembers } from '@/services/memberService';
import { SavedViewsDropdown } from '@/features/views/SavedViewsDropdown';
import { CreateIssueModal } from '@/features/issues/components/CreateIssueModal';
import { IssueDetailPage } from '@/features/issues/pages/IssueDetailPage';
import BoardPage from './BoardPage';
import IssueListPage from './IssueListPage';
import ProjectCalendarPage from './ProjectCalendarPage';
import { IssueTimelineView } from '@/features/issues/components/IssueTimelineView';
import type { Issue, Member, WorkflowStatus } from '@/store/types';
import { toast } from 'sonner';

type ViewMode = 'board' | 'list' | 'calendar' | 'timeline';

export function ProjectWorkPage() {
  const { t } = useTranslation(['issues', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  const { issueId } = useParams<{ issueId?: string }>();
  const dispatch = useAppDispatch();

  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const { statuses } = useProjectWorkflow(projectId);

  const filters = useAppSelector((state) => state.issue.filters);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [members, setMembers] = useState<Member[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Active view synced with URL ?view=...
  const rawView = searchParams.get('view');
  const activeView: ViewMode =
    rawView === 'list' || rawView === 'calendar' || rawView === 'timeline'
      ? rawView
      : 'board';

  const defaultStatuses: WorkflowStatus[] = useMemo(
    () => [
      { id: 'TODO', workflowId: '', name: t('columns.todo', { defaultValue: 'To Do' }), category: 'TODO', order: 0, color: DEFAULT_CATEGORY_COLORS.TODO },
      { id: 'IN_PROGRESS', workflowId: '', name: t('columns.inProgress', { defaultValue: 'In Progress' }), category: 'IN_PROGRESS', order: 1, color: DEFAULT_CATEGORY_COLORS.IN_PROGRESS },
      { id: 'IN_PREVIEW', workflowId: '', name: t('columns.inPreview', { defaultValue: 'In Preview' }), category: 'IN_PREVIEW', order: 2, color: DEFAULT_CATEGORY_COLORS.IN_PREVIEW },
      { id: 'DONE', workflowId: '', name: t('columns.done', { defaultValue: 'Done' }), category: 'DONE', order: 3, color: DEFAULT_CATEGORY_COLORS.DONE },
    ],
    [t]
  );

  const activeStatuses = useMemo(() => {
    if (statuses && statuses.length > 0) return statuses;
    return defaultStatuses;
  }, [statuses, defaultStatuses]);

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const userRole = currentMember?.role;
  const canCreate = !userRole || userRole === 'ADMIN' || userRole === 'MEMBER';

  // Load project members and refresh issues when filters/project change
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      dispatch(setLoading(true));
      try {
        const [issuesRes, membersRes] = await Promise.all([
          getIssues(projectId, filters),
          getProjectMembers(projectId),
        ]);
        dispatch(setIssues({ items: issuesRes.items, total: issuesRes.meta.total }));
        setMembers(membersRes);
        dispatch(fetchBoardIssues(projectId));
      } catch (err) {
        console.error('Error fetching work workspace data:', err);
        dispatch(setError(t('common:status.error', { defaultValue: 'Error loading issues' })));
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadData();
  }, [projectId, filters, dispatch, t]);

  const handleTabChange = (view: ViewMode) => {
    const newParams = new URLSearchParams(searchParams);
    if (view === 'board') {
      newParams.delete('view');
    } else {
      newParams.set('view', view);
    }
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    dispatch(setFilters({ [key]: value, page: 1 }));
  };

  const handleCreateIssue = async (data: Partial<Issue>) => {
    if (!projectId) return;
    try {
      const created = await createIssue(projectId, data);
      dispatch(addIssue(created));
      toast.success(t('common:status.success', { defaultValue: 'Issue created successfully' }));
      setCreateModalOpen(false);
    } catch (err) {
      toast.error(t('common:status.error', { defaultValue: 'Failed to create issue' }));
      throw err;
    }
  };

  if (projectLoading) {
    return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading project work...' })} />;
  }

  if (is404 || !project) {
    return <NotFound />;
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full min-h-0">
        {/* Top Control Bar: View Switcher, Filter Bar & Create Button */}
        <div className="flex flex-col space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* 4-View Switcher Tab Strip */}
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange('board')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeView === 'board'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Board
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('list')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeView === 'list'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                List
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('calendar')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeView === 'calendar'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Calendar
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('timeline')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeView === 'timeline'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Timeline
              </button>
            </div>

            {/* Actions: Saved Views + Create Issue */}
            <div className="flex items-center gap-2.5 shrink-0">
              {projectId && (
                <SavedViewsDropdown
                  projectId={projectId}
                  currentFilters={filters}
                  onApplyView={(savedFilters) => {
                    dispatch(
                      setFilters({
                        search: savedFilters.search || '',
                        status: savedFilters.status || undefined,
                        priority: savedFilters.priority || undefined,
                        assigneeId: savedFilters.assigneeId || undefined,
                        overdue: savedFilters.overdue || undefined,
                        dueSoon: savedFilters.dueSoon || undefined,
                        noDueDate: savedFilters.noDueDate || undefined,
                        dueDateFrom: savedFilters.dueDateFrom || undefined,
                        dueDateTo: savedFilters.dueDateTo || undefined,
                        page: 1,
                      })
                    );
                  }}
                  userRole={userRole}
                  currentUserId={currentUser?.id}
                />
              )}
              {canCreate && (
                <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-9 text-xs font-semibold gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  {t('board.createIssue', { defaultValue: 'Create Issue' })}
                </Button>
              )}
            </div>
          </div>

          {/* Shared Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder={t('board.searchPlaceholder', { defaultValue: 'Search issues...' })}
                className="pl-8 h-8 text-xs bg-slate-50/50"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'ALL'}
              onValueChange={(v) => handleFilterChange('status', v === 'ALL' ? undefined : v)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs shrink-0 bg-slate-50/50">
                <SelectValue placeholder={t('detail.status', { defaultValue: 'Status' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('board.allStatus', { defaultValue: 'All Statuses' })}</SelectItem>
                {activeStatuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filters.priority || 'ALL'}
              onValueChange={(v) => handleFilterChange('priority', v === 'ALL' ? undefined : v)}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs shrink-0 bg-slate-50/50">
                <SelectValue placeholder={t('detail.priority', { defaultValue: 'Priority' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('board.allPriority', { defaultValue: 'All Priorities' })}</SelectItem>
                <SelectItem value="LOW">{t('priorities.low', { defaultValue: 'Low' })}</SelectItem>
                <SelectItem value="MEDIUM">{t('priorities.medium', { defaultValue: 'Medium' })}</SelectItem>
                <SelectItem value="HIGH">{t('priorities.high', { defaultValue: 'High' })}</SelectItem>
                <SelectItem value="URGENT">{t('priorities.urgent', { defaultValue: 'Urgent' })}</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignee Filter */}
            <Select
              value={filters.assigneeId || 'ALL'}
              onValueChange={(v) => handleFilterChange('assigneeId', v === 'ALL' ? undefined : v)}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs shrink-0 bg-slate-50/50">
                <SelectValue placeholder={t('detail.assignee', { defaultValue: 'Assignee' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('board.allAssignee', { defaultValue: 'All Assignees' })}</SelectItem>
                <SelectItem value="unassigned">{t('form.unassigned', { defaultValue: 'Unassigned' })}</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name || m.userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Issue Type Filter */}
            <Select
              value={(filters as any).type || 'ALL'}
              onValueChange={(v) => handleFilterChange('type' as any, v === 'ALL' ? undefined : v)}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs shrink-0 bg-slate-50/50">
                <SelectValue placeholder={t('detail.issueType', { defaultValue: 'Type' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('board.allType', { defaultValue: 'All Types' })}</SelectItem>
                <SelectItem value="TASK">Task</SelectItem>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="FEATURE">Feature</SelectItem>
                <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
              </SelectContent>
            </Select>

            {/* Milestone Filter */}
            <Select
              value={(filters as any).milestoneId || 'ALL'}
              onValueChange={(v) => handleFilterChange('milestoneId' as any, v === 'ALL' ? undefined : v)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs shrink-0 bg-slate-50/50">
                <SelectValue placeholder={t('detail.milestone', { defaultValue: 'Milestone' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('board.allMilestone', { defaultValue: 'All Milestones' })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Content Area */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          {activeView === 'list' ? (
            <IssueListPage standalone={false} />
          ) : activeView === 'calendar' ? (
            <ProjectCalendarPage standalone={false} />
          ) : activeView === 'timeline' ? (
            <IssueTimelineView />
          ) : (
            <BoardPage standalone={false} />
          )}
        </div>
      </div>

      {/* Slide-over / Modal Detail View */}
      {issueId && <IssueDetailPage />}
      <Outlet />

      {/* Create Issue Dialog */}
      <CreateIssueModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        members={members}
        onSubmit={handleCreateIssue}
        projectId={projectId}
      />
    </>
  );
}

export default ProjectWorkPage;
