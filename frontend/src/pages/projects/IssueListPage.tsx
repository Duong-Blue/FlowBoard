import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { getIssues, createIssue, updateIssue, deleteIssue } from '../../services/issueService';
import { getProjectMembers } from '../../services/memberService';
import { setIssues, setLoading, setError, setFilters, addIssue, updateIssue as updateIssueAction, removeIssue } from '../../store/slices/issueSlice';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { IssueFormDialog } from './components/IssueFormDialog';
import { SavedViewsDropdown } from '../../features/views/SavedViewsDropdown';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, LayoutList, ListTree, List, CornerDownRight } from 'lucide-react';
import type { Issue, IssueUser, Member, WorkflowStatus } from '../../store/types';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { useProjectWorkflow, DEFAULT_CATEGORY_COLORS } from '@/hooks/useProjectWorkflow';
import NotFound from '../NotFound';

export interface TreeIssueItem {
  issue: Issue;
  depth: number;
}

export function buildIssueTree(issues: Issue[]): TreeIssueItem[] {
  const issueMap = new Map<string, Issue>();
  const childrenMap = new Map<string, Issue[]>();

  issues.forEach((issue) => {
    issueMap.set(issue.id, issue);
  });

  const rootIssues: Issue[] = [];

  issues.forEach((issue) => {
    if (issue.parentId && issueMap.has(issue.parentId)) {
      const parentChildren = childrenMap.get(issue.parentId) || [];
      parentChildren.push(issue);
      childrenMap.set(issue.parentId, parentChildren);
    } else {
      rootIssues.push(issue);
    }
  });

  const result: TreeIssueItem[] = [];

  function traverse(node: Issue, depth: number) {
    result.push({ issue: node, depth });
    const children = childrenMap.get(node.id) || [];
    children.forEach((child) => traverse(child, depth + 1));
  }

  rootIssues.forEach((root) => traverse(root, 0));

  return result;
}

export default function IssueListPage() {
  const { t } = useTranslation(['issues', 'common']);
  const { orgId } = useParams<{ orgId: string }>();
  const { project, projectId, loading: projectLoading, is404, loading: resolvedLoading } = useResolvedProject();
  const { statuses, getStatusById, getStatusColor } = useProjectWorkflow(projectId);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { list: issues, total, filters, loading } = useAppSelector((state) => state.issue);
  const [members, setMembers] = useState<Member[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>();
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical');

  const defaultStatuses: WorkflowStatus[] = useMemo(() => [
    { id: 'TODO', workflowId: '', name: t('columns.todo'), category: 'TODO', order: 0, color: DEFAULT_CATEGORY_COLORS.TODO },
    { id: 'IN_PROGRESS', workflowId: '', name: t('columns.inProgress'), category: 'IN_PROGRESS', order: 1, color: DEFAULT_CATEGORY_COLORS.IN_PROGRESS },
    { id: 'IN_PREVIEW', workflowId: '', name: t('columns.inPreview'), category: 'IN_PREVIEW', order: 2, color: DEFAULT_CATEGORY_COLORS.IN_PREVIEW },
    { id: 'DONE', workflowId: '', name: t('columns.done'), category: 'DONE', order: 3, color: DEFAULT_CATEGORY_COLORS.DONE },
  ], [t]);

  const activeStatuses = useMemo(() => {
    if (statuses && statuses.length > 0) return statuses;
    return defaultStatuses;
  }, [statuses, defaultStatuses]);

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const userRole = currentMember?.role;
  const canCreateOrEdit = !userRole || userRole === 'ADMIN' || userRole === 'MEMBER';
  const canDelete = userRole === 'ADMIN';

  const getUserDisplayName = (user?: IssueUser) => {
    if (!user) return t('form.unassigned');
    if (user.displayName) return user.displayName;
    if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.email || t('form.unassigned');
  };

  useEffect(() => {
    if (!projectId) return;

    const fetchIssuesAndMembers = async () => {
      dispatch(setLoading(true));
      try {
        const [issuesRes, membersRes] = await Promise.all([
          getIssues(projectId, filters),
          getProjectMembers(projectId),
        ]);
        dispatch(setIssues({ items: issuesRes.items, total: issuesRes.meta.total }));
        setMembers(membersRes);
      } catch (err) {
        console.error('Error fetching project data:', err);
        dispatch(setError(t('common:status.error')));
        toast.error(t('common:status.error'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchIssuesAndMembers();
  }, [projectId, filters, dispatch, t]);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    dispatch(setFilters({ [key]: value, page: 1 }));
  };

  const handleCreateOrUpdate = async (data: Partial<Issue>) => {
    if (!projectId) return;
    try {
      if (editingIssue) {
        const updated = await updateIssue(projectId, editingIssue.id, data);
        dispatch(updateIssueAction(updated));
        toast.success(t('common:status.success'));
      } else {
        const created = await createIssue(projectId, data);
        dispatch(addIssue(created));
        toast.success(t('common:status.success'));
      }
    } catch (err) {
      toast.error(t('common:status.error'));
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!projectId) return;
    if (!confirm(t('detail.deleteConfirm'))) return;
    try {
      await deleteIssue(projectId, id);
      dispatch(removeIssue(id));
      toast.success(t('common:status.success'));
    } catch (err) {
      console.error('Error deleting issue:', err);
      toast.error(t('common:status.error'));
    }
  };

  if (projectLoading || (resolvedLoading && !project)) {
    return <PageLoader text={t('common:status.loading')} />;
  }

  if (is404 || !project) {
    return <NotFound />;
  }

  const currentOrgId = orgId || activeOrgId || project.organizationId || project.orgId;

  const displayItems: TreeIssueItem[] = viewMode === 'hierarchical'
    ? buildIssueTree(issues)
    : issues.map((issue) => ({ issue, depth: 0 }));

  return (
    <ProjectPageShell
      project={project}
      title={t('board.listView')}
      activeView="list"
      actions={
        canCreateOrEdit ? (
          <Button onClick={() => { setEditingIssue(undefined); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('board.createIssue')}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder={t('board.searchPlaceholder')}
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
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
        <div className="inline-flex rounded-md border p-1 bg-slate-100 gap-1 text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('hierarchical')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              viewMode === 'hierarchical'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTree className="h-3.5 w-3.5" />
            Hierarchical
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flat')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              viewMode === 'flat'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Flat
          </button>
        </div>
        <Select value={filters.status || 'ALL'} onValueChange={(v) => handleFilterChange('status', v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-[150px] shrink-0">
            <SelectValue placeholder={t('detail.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('board.all')}</SelectItem>
            {activeStatuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.priority || 'ALL'} onValueChange={(v) => handleFilterChange('priority', v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-[150px] shrink-0">
            <SelectValue placeholder={t('detail.priority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('board.all')}</SelectItem>
            <SelectItem value="LOW">{t('priorities.low')}</SelectItem>
            <SelectItem value="MEDIUM">{t('priorities.medium')}</SelectItem>
            <SelectItem value="HIGH">{t('priorities.high')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.assigneeId || 'ALL'} onValueChange={(v) => handleFilterChange('assigneeId', v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-[180px] shrink-0">
            <SelectValue placeholder={t('detail.assignee')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('board.all')}</SelectItem>
            <SelectItem value="unassigned">{t('form.unassigned')}</SelectItem>
            {members.map(m => (
              <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && issues.length === 0 ? (
        <PageLoader text={t('common:status.loading')} />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={LayoutList}
          title={t('common:emptyState.noData')}
          description={t('board.createIssue')}
          action={
            canCreateOrEdit ? (
              <Button onClick={() => { setEditingIssue(undefined); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('board.createIssue')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-md border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">{t('form.titleLabel')}</th>
                  <th className="px-4 py-3 font-medium">{t('detail.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('detail.priority')}</th>
                  <th className="px-4 py-3 font-medium">{t('detail.assignee')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common:labels.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayItems.map(({ issue, depth }) => (
                  <tr 
                    key={issue.id} 
                    className="hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => {
                      const targetOrgId = currentOrgId;
                      const targetProjectKey = project.key;
                      const issueKey = issue.key || issue.id;
                      if (targetOrgId && targetProjectKey) {
                        navigate(`/workspace/orgs/${targetOrgId}/projects/${targetProjectKey}/issues/${issueKey}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{issue.key}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: depth > 0 ? `${depth * 1.5}rem` : undefined }}
                      >
                        {depth > 0 && <CornerDownRight className="h-4 w-4 text-slate-400 shrink-0" />}
                        <span>{issue.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const statusMeta = getStatusById(issue.workflowStatusId) || activeStatuses.find(s => s.id === issue.workflowStatusId || s.category === issue.status);
                        const statusName = statusMeta?.name || issue.workflowStatus?.name || issue.status;
                        const statusColor = statusMeta?.color || getStatusColor(issue.workflowStatusId || issue.status);
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
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
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <SemanticBadge status={
                        issue.priority === 'HIGH' ? 'admin' :
                        issue.priority === 'MEDIUM' ? 'member' : 'guest'
                      }>
                        {issue.priority}
                      </SemanticBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {getUserDisplayName(issue.assignee)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canCreateOrEdit && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingIssue(issue); setDialogOpen(true); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(issue.id); }}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-slate-500">
            <div>
              {(() => {
                const page = filters.page || 1;
                const limit = filters.limit || 10;
                const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
                const endItem = Math.min(page * limit, total);
                return t('board.showingIssues', {
                  start: startItem,
                  end: endItem,
                  total,
                  defaultValue: `Showing ${startItem} - ${endItem} of ${total} issues`,
                });
              })()}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={(filters.page || 1) <= 1}
                onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={issues.length < (filters.limit || 10) || (filters.page || 1) * (filters.limit || 10) >= total}
                onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <IssueFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        issue={editingIssue}
        members={members}
        onSubmit={handleCreateOrUpdate}
      />
      </div>
    </ProjectPageShell>
  );
}
