import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { getIssues, createIssue, updateIssue, deleteIssue } from '../../services/issueService';
import { getProjectMembers } from '../../services/memberService';
import { setIssues, setLoading, setError, setFilters, addIssue, updateIssue as updateIssueAction, removeIssue } from '../../store/slices/issueSlice';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { IssueFormDialog } from './components/IssueFormDialog';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, LayoutList, LayoutDashboard } from 'lucide-react';
import type { Issue, IssueUser, Member } from '../../store/types';

export default function IssueListPage() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { list: issues, total, filters, loading } = useAppSelector((state) => state.issue);
  const [members, setMembers] = useState<Member[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>();
  const [initialLoaded, setInitialLoaded] = useState(false);

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const userRole = currentMember?.role;
  const canCreateOrEdit = !userRole || userRole === 'ADMIN' || userRole === 'MEMBER';
  const canDelete = userRole === 'ADMIN';

  const getUserDisplayName = (user?: IssueUser) => {
    if (!user) return 'Unassigned';
    if (user.displayName) return user.displayName;
    if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.email || 'Unassigned';
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
        dispatch(setError('Failed to load issues'));
        toast.error('Failed to load issues');
      } finally {
        dispatch(setLoading(false));
        setInitialLoaded(true);
      }
    };

    fetchIssuesAndMembers();
  }, [projectId, filters, dispatch]);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    dispatch(setFilters({ [key]: value, page: 1 }));
  };

  const handleCreateOrUpdate = async (data: Partial<Issue>) => {
    if (!projectId) return;
    try {
      if (editingIssue) {
        const updated = await updateIssue(projectId, editingIssue.id, data);
        dispatch(updateIssueAction(updated));
        toast.success('Issue updated');
      } else {
        const created = await createIssue(projectId, data);
        dispatch(addIssue(created));
        toast.success('Issue created');
      }
    } catch (err) {
      toast.error('Failed to save issue');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!projectId) return;
    if (!confirm('Are you sure you want to delete this issue?')) return;
    try {
      await deleteIssue(projectId, id);
      dispatch(removeIssue(id));
      toast.success('Issue deleted');
    } catch (err) {
      toast.error('Failed to delete issue');
    }
  };

  if (!initialLoaded) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issues</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" className="pointer-events-none opacity-50">
            <LayoutList className="mr-2 h-4 w-4" />
            List View
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/orgs/${orgId}/projects/${projectId}/board`}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Board View
            </Link>
          </Button>
          {canCreateOrEdit && (
            <Button onClick={() => { setEditingIssue(undefined); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Issue
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search issues..."
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <Select value={filters.status || 'ALL'} onValueChange={(v) => handleFilterChange('status', v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.priority || 'ALL'} onValueChange={(v) => handleFilterChange('priority', v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.assigneeId || 'ALL'} onValueChange={(v) => handleFilterChange('assigneeId', v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map(m => (
              <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && issues.length === 0 ? (
        <PageLoader />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={LayoutList}
          title="No issues found"
          description="Create your first issue to get started."
          action={
            canCreateOrEdit ? (
              <Button onClick={() => { setEditingIssue(undefined); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                New Issue
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
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {issues.map(issue => (
                  <tr 
                    key={issue.id} 
                    className="hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => {
                      const targetOrgId = orgId || activeOrgId;
                      const targetProjectId = projectId || issue.projectId;
                      const issueKey = issue.key || issue.id;
                      if (targetOrgId && targetProjectId) {
                        navigate(`/orgs/${targetOrgId}/projects/${targetProjectId}/issues/${issueKey}`);
                      } else if (targetProjectId) {
                        navigate(`/projects/${targetProjectId}/issues/${issueKey}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{issue.key}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{issue.title}</td>
                    <td className="px-4 py-3">
                      <SemanticBadge status={
                        issue.status === 'TODO' ? 'archived' : 
                        issue.status === 'IN_PROGRESS' ? 'active' : 'owner'
                      }>
                        {issue.status}
                      </SemanticBadge>
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
          
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-slate-500">
              Total {total} issues
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
                disabled={issues.length < (filters.limit || 10)}
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
  );
}
