import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/types';
import { IssueDetailView } from '../components/IssueDetailView';
import { getIssue, updateIssue as updateIssueApi, deleteIssue as deleteIssueApi } from '@/services/issueService';
import { getProjectMembers } from '@/services/memberService';
import { updateIssue, addIssue, removeIssue } from '@/store/slices/issueSlice';
import { type Issue, type IssueUser } from '@/store/types';

export function IssueDetailPage() {
  const { orgId, projectId, issueId } = useParams<{ orgId?: string; projectId: string; issueId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<IssueUser[]>([]);
  
  const issue = useSelector((state: RootState) => 
    state.issue.list.find(i => i.id === issueId || i.key === issueId)
  );

  React.useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!projectId || !issueId) return;
      try {
        setLoading(true);
        const membersData = await getProjectMembers(projectId);
        if (!mounted) return;
        
        const mappedMembers = membersData.map(m => ({
          id: m.userId,
          displayName: m.name,
          email: m.email,
        }));
        setMembers(mappedMembers);

        const issueData = await getIssue(projectId, issueId);
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
  }, [projectId, issueId, dispatch]); // omitting 'issue' from dependencies to prevent infinite loops

  const handleUpdate = async (data: Partial<Issue>) => {
    if (!projectId || !issueId) return;
    try {
      const updatedIssue = await updateIssueApi(projectId, issueId, data);
      dispatch(updateIssue(updatedIssue));
    } catch (err) {
      console.error('Failed to update issue:', err);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !issueId) return;
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await deleteIssueApi(projectId, issueId);
        dispatch(removeIssue(issueId));
        if (orgId) {
          navigate(`/orgs/${orgId}/projects/${projectId}/board`);
        } else {
          navigate(`/projects/${projectId}/board`);
        }
      } catch (err) {
        console.error('Failed to delete issue:', err);
      }
    }
  };

  const canDelete = true; 

  if (loading && !issue) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-muted-foreground animate-pulse">Loading issue details...</div>
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-destructive">
        {error}
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  return (
    <div className="h-full bg-background overflow-hidden">
      <IssueDetailView 
        issue={issue} 
        members={members}
        canDelete={canDelete}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
