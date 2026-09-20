import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/types';
import { IssueDetailView } from '../components/IssueDetailView';
import { getIssue, updateIssue as updateIssueApi, deleteIssue as deleteIssueApi } from '@/services/issueService';
import { getProjectMembers } from '@/services/memberService';
import { updateIssue, addIssue, removeIssue } from '@/store/slices/issueSlice';
import { type Issue, type IssueUser } from '@/store/types';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export function IssueDetailPage() {
  const { t } = useTranslation('issues');
  const { orgId, projectKey, projectId, issueId } = useParams<{ orgId?: string; projectKey?: string; projectId?: string; issueId?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { project, projectId: resolvedProjectId } = useResolvedProject();
  const activeOrgId = useSelector((state: RootState) => state.org.activeOrgId);

  const effectiveOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;
  const effectiveProjectKey = projectKey || project?.key;
  const effectiveProjectId = resolvedProjectId || projectId || project?.id;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<IssueUser[]>([]);
  
  const issue = useSelector((state: RootState) => 
    state.issue.list.find(i => i.id === issueId || i.key?.toLowerCase() === issueId?.toLowerCase())
  );

  React.useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!effectiveProjectId || !issueId) return;
      try {
        setLoading(true);
        const membersData = await getProjectMembers(effectiveProjectId);
        if (!mounted) return;
        
        const mappedMembers = membersData.map(m => ({
          id: m.userId,
          displayName: m.name,
          email: m.email,
        }));
        setMembers(mappedMembers);

        const issueData = await getIssue(effectiveProjectId, issueId);
        if (!mounted) return;
        
        // Dispatch to update Redux store
        if (!issue) {
           dispatch(addIssue(issueData));
        } else {
           dispatch(updateIssue(issueData));
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load issue details');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    loadData();
    return () => { mounted = false; };
  }, [effectiveProjectId, issueId, dispatch]);

  const handleUpdate = async (data: Partial<Issue>) => {
    if (!effectiveProjectId || !issueId) return;
    try {
      const targetIssueId = issue?.id || issueId;
      const updatedIssue = await updateIssueApi(effectiveProjectId, targetIssueId, data);
      dispatch(updateIssue(updatedIssue));
    } catch (err) {
      console.error('Failed to update issue:', err);
    }
  };

  const handleDelete = async () => {
    if (!effectiveProjectId || !issueId) return;
    if (window.confirm(t('detail.deleteConfirm'))) {
      try {
        const targetIssueId = issue?.id || issueId;
        await deleteIssueApi(effectiveProjectId, targetIssueId);
        dispatch(removeIssue(targetIssueId));
        if (effectiveOrgId && effectiveProjectKey) {
          navigate(`/workspace/orgs/${effectiveOrgId}/projects/${effectiveProjectKey}/issues`);
        }
      } catch (err) {
        console.error('Failed to delete issue:', err);
      }
    }
  };

  const handleClose = () => {
    if (effectiveOrgId && effectiveProjectKey) {
      navigate(`/workspace/orgs/${effectiveOrgId}/projects/${effectiveProjectKey}/issues`);
    } else {
      navigate(-1);
    }
  };

  const canDelete = true;

  return (
    <Sheet open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent side="right">
        <SheetTitle className="sr-only">
          {issue ? issue.key : t('detail.title', 'Issue Detail')}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {issue ? issue.title : 'Issue details side drawer'}
        </SheetDescription>

        {loading && !issue ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-muted-foreground animate-pulse">{t('detail.loading')}</div>
          </div>
        ) : error && !issue ? (
          <div className="flex h-full items-center justify-center p-8 text-destructive">
            {error}
          </div>
        ) : issue ? (
          <IssueDetailView 
            issue={issue} 
            members={members}
            canDelete={canDelete}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
