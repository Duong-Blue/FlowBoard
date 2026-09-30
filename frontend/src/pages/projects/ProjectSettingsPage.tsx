import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sliders, Users, Workflow, Tag, Bell, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../store';
import { getOrgMembers, getProjectMembers } from '../../services/memberService';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/shared/PageLoader';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import NotFound from '../NotFound';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { GeneralSettingsTab } from '@/features/projects/components/GeneralSettingsTab';
import { ProjectMembersTab } from '@/features/projects/components/ProjectMembersTab';
import { WorkflowSettingsTab } from '@/features/projects/components/WorkflowSettingsTab';
import { IssueTypesTab } from '@/features/projects/components/IssueTypesTab';
import { NotificationsTab } from '@/features/projects/components/NotificationsTab';
import { DangerZoneTab } from '@/features/projects/components/DangerZoneTab';
import type { Member, Project } from '../../store/types';

export type SettingsTabType = 'general' | 'members' | 'workflow' | 'issuetypes' | 'notifications' | 'danger';

const VALID_TABS: SettingsTabType[] = ['general', 'members', 'workflow', 'issuetypes', 'notifications', 'danger'];

export default function ProjectSettingsPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId, projectKey } = useParams<{ orgId: string; projectKey: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  const tabParam = searchParams.get('tab') as SettingsTabType;
  const activeTab: SettingsTabType = VALID_TABS.includes(tabParam) ? tabParam : 'general';

  const [localProject, setLocalProject] = useState<Project | null>(null);
  const currentProject = localProject || project;
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  const handleTabChange = (tab: SettingsTabType) => {
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    async function checkUserRole() {
      if (!currentOrgId || !user || !projectId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [orgMembers, projectMembers] = await Promise.all([
          getOrgMembers(currentOrgId).catch(() => []),
          getProjectMembers(projectId).catch(() => []),
        ]);

        const orgMe = orgMembers.find((m: Member) => m.userId === user.id);
        const projMe = projectMembers.find((m: Member) => m.userId === user.id);

        const isOrgAdmin = orgMe?.role === 'ADMIN' || orgMe?.role === 'OWNER';
        const isProjAdmin = projMe?.role === 'ADMIN';

        setIsAdmin(Boolean(isOrgAdmin || isProjAdmin));
      } catch (err) {
        console.error('Failed to verify user permissions:', err);
      } finally {
        setLoading(false);
      }
    }

    checkUserRole();
  }, [currentOrgId, projectId, user]);

  if (projectLoading || loading) return <PageLoader text={t('common:status.loading')} />;
  if (is404 || !project || !currentProject) return <NotFound />;

  const displayKey = currentProject.key || projectKey;

  const tabs = [
    {
      id: 'general' as const,
      label: t('projects.generalTab', { defaultValue: 'General' }),
      icon: Sliders,
    },
    {
      id: 'members' as const,
      label: t('projects.membersTab', { defaultValue: 'Members' }),
      icon: Users,
    },
    {
      id: 'workflow' as const,
      label: t('projects.workflowTab', { defaultValue: 'Workflow' }),
      icon: Workflow,
    },
    {
      id: 'issuetypes' as const,
      label: t('projects.issueTypesTab', { defaultValue: 'Issue Types' }),
      icon: Tag,
    },
    {
      id: 'notifications' as const,
      label: t('projects.notificationsTab', { defaultValue: 'Notifications' }),
      icon: Bell,
    },
    {
      id: 'danger' as const,
      label: t('projects.dangerZoneTab', { defaultValue: 'Danger Zone' }),
      icon: AlertTriangle,
    },
  ];

  return (
    <ProjectPageShell
      project={currentProject || project}
      title={t('projects.settingsTitle')}
      subtitle={t('projects.settingsSubtitle', { name: currentProject.name })}
      activeView="settings"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/workspace/orgs/${currentOrgId}/projects/${displayKey}/board`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('projects.backToProject')}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Tabs Switcher Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav
            role="tablist"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 no-scrollbar"
            aria-label={t('projects.settingsTabs', { defaultValue: 'Settings Navigation' })}
          >
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              const isDanger = tabItem.id === 'danger';
              return (
                <button
                  key={tabItem.id}
                  id={`tab-${tabItem.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tabItem.id}`}
                  onClick={() => handleTabChange(tabItem.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-t-md ${
                    isActive
                      ? isDanger
                        ? 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 font-semibold bg-red-50/50 dark:bg-red-950/30'
                        : 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
                      : isDanger
                      ? 'border-transparent text-red-600/70 dark:text-red-400/70 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-800'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? isDanger
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400'
                        : isDanger
                        ? 'text-red-500/70'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Panel Content */}
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="pt-1 outline-none"
        >
          {activeTab === 'general' && (
            <GeneralSettingsTab
              project={currentProject}
              currentOrgId={currentOrgId || ''}
              isAdmin={isAdmin}
              onProjectUpdated={(updated) => setLocalProject(updated)}
              hideDangerZone={true}
            />
          )}

          {activeTab === 'members' && (
            <ProjectMembersTab
              projectId={projectId}
              currentOrgId={currentOrgId || ''}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'workflow' && (
            <WorkflowSettingsTab projectId={projectId} isAdmin={isAdmin} />
          )}

          {activeTab === 'issuetypes' && <IssueTypesTab />}

          {activeTab === 'notifications' && (
            <NotificationsTab projectId={projectId} isAdmin={isAdmin} />
          )}

          {activeTab === 'danger' && (
            <DangerZoneTab
              project={currentProject}
              currentOrgId={currentOrgId || ''}
              isAdmin={isAdmin}
              onProjectUpdated={(updated) => setLocalProject(updated)}
            />
          )}
        </div>
      </div>
    </ProjectPageShell>
  );
}
