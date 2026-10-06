import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setOrgs } from '@/store/slices/orgSlice';
import { getOrgs } from '@/services/orgService';
import { getProjects } from '@/services/projectService';
import { getIssues, getActivities, type IssueActivity } from '@/services/issueService';
import { getMyInvitations, acceptInvitation, declineInvitation } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WelcomeSection } from '@/features/workspace/components/WelcomeSection';
import { PendingInvitationsSection } from '@/features/workspace/components/PendingInvitationsSection';
import { OrganizationList } from '@/features/workspace/components/OrganizationList';
import { ProjectsSection } from '@/features/workspace/components/ProjectsSection';
import { MyWorkList } from '@/features/workspace/components/MyWorkList';
import { RecentActivity, type ActivityItem } from '@/features/workspace/components/RecentActivity';
import type { Project, Issue, Invitation } from '@/store/types';

export function WorkspaceHome() {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const orgs = useAppSelector((state) => state.org.list);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const hasFetchedOrgs = useRef(false);

  const fetchWorkspaceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      try {
        const invs = await getMyInvitations();
        setPendingInvitations(invs || []);
      } catch (err: unknown) {
        console.warn('Failed to fetch user invitations:', err);
      }

      let currentOrgs = orgs;
      if (currentOrgs.length === 0 && !hasFetchedOrgs.current) {
        hasFetchedOrgs.current = true;
        try {
          const fetchedOrgs = await getOrgs();
          dispatch(setOrgs(fetchedOrgs));
          currentOrgs = fetchedOrgs;
        } catch (err: unknown) {
          console.warn('Failed to fetch orgs in WorkspaceHome:', err);
        }
      }

      if (currentOrgs.length === 0) {
        setProjects([]);
        setAssignedIssues([]);
        setRecentActivities([]);
        setLoading(false);
        return;
      }

      // 2. Fetch accessible projects for all orgs concurrently (batch per org)
      const projectResults = await Promise.all(
        currentOrgs.map((org) =>
          getProjects(org.id).catch(() => [] as Project[])
        )
      );
      const allProjects = projectResults.flat();
      setProjects(allProjects);

      // 3. Fetch assigned issues if logged in and projects exist
      const userId = user?.id;
      if (userId && allProjects.length > 0) {
        const targetProjects = allProjects.slice(0, 10);
        const issueResults = await Promise.all(
          targetProjects.map((proj) =>
            getIssues(proj.id, { assigneeId: userId, limit: 10 }).catch(() => ({
              items: [] as Issue[],
              meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }))
          )
        );

        const allIssues = issueResults.flatMap((res) => res.items || []);
        allIssues.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
        setAssignedIssues(allIssues);

        // 4. Fetch recent activities for top assigned issues
        if (allIssues.length > 0) {
          const topIssues = allIssues.slice(0, 5);
          const activityResults = await Promise.all(
            topIssues.map((issue) => {
              const projId = issue.projectId || issue.project?.id;
              if (!projId) return Promise.resolve({ items: [] });
              return getActivities(projId, issue.id, 1, 5).catch(() => ({ items: [] }));
            })
          );

          const mappedActivities: ActivityItem[] = activityResults
            .flatMap((res, idx) => {
              const issue = topIssues[idx];
              return (res.items || []).map((act: IssueActivity) => ({
                id: act.id,
                type: act.type,
                user: act.actor
                  ? {
                      id: act.actor.id,
                      displayName: act.actor.displayName,
                      name:
                        `${act.actor.firstName || ''} ${act.actor.lastName || ''}`.trim() ||
                        act.actor.email,
                      avatarUrl: act.actor.avatarUrl,
                      email: act.actor.email,
                    }
                  : undefined,
                createdAt: act.createdAt,
                targetItem: issue
                  ? { id: issue.id, key: issue.key, title: issue.title }
                  : undefined,
                metadata: act.metadata,
              }));
            })
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

          setRecentActivities(mappedActivities);
        } else {
          setRecentActivities([]);
        }
      } else {
        setAssignedIssues([]);
        setRecentActivities([]);
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'Failed to load workspace data';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [dispatch, orgs, user?.id]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const handleAcceptInvitation = async (inv: Invitation) => {
    const orgId = inv.organizationId || inv.orgId || inv.organization?.id || '';
    const token = inv.metadata?.token || '';
    await acceptInvitation(orgId, token);
    try {
      const fetchedOrgs = await getOrgs();
      dispatch(setOrgs(fetchedOrgs));
    } catch (err: unknown) {
      console.warn('Failed to refresh orgs after accepting invitation:', err);
    }
    await fetchWorkspaceData();
  };

  const handleDeclineInvitation = async (inv: Invitation) => {
    const orgId = inv.organizationId || inv.orgId || inv.organization?.id || '';
    const token = inv.metadata?.token || '';
    await declineInvitation(orgId, token);
    await fetchWorkspaceData();
  };

  const handleCreateProject = () => {
    if (orgs.length === 1) {
      navigate(`/workspace/orgs/${orgs[0].id}/projects/new`);
    } else {
      navigate('/workspace/orgs/new');
    }
  };

  const displayName = user?.name || user?.email || 'User';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Error state alert with retry */}
      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchWorkspaceData}
            className="border-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.retry', { defaultValue: 'Retry' })}
          </Button>
        </Card>
      )}

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Welcome, My Work, Projects, Organizations */}
        <div className="lg:col-span-2 space-y-6">
          <WelcomeSection
            userName={displayName}
            organizations={orgs}
            onCreateOrg={() => navigate('/workspace/orgs/new')}
            onJoinOrg={() => navigate('/workspace/invitations')}
          />

          <PendingInvitationsSection
            invitations={pendingInvitations}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
          />

          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('home.myWork.title', { defaultValue: 'My Work' })}
            </h2>
            <MyWorkList issues={assignedIssues} loading={loading} />
          </div>

          <ProjectsSection
            projects={projects}
            onCreateProject={handleCreateProject}
          />

          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('home.organizations.title', { defaultValue: 'Organizations' })}
            </h2>
            <OrganizationList orgs={orgs} />
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-1 space-y-6">
          <RecentActivity activities={recentActivities} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default WorkspaceHome;
