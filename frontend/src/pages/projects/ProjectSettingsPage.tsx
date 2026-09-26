import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sliders, Workflow, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../store';
import { getOrgMembers, getProjectMembers } from '../../services/memberService';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/shared/PageLoader';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import NotFound from '../NotFound';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { GeneralSettingsTab } from '@/features/projects/components/GeneralSettingsTab';
import { WorkflowSettingsTab } from '@/features/projects/components/WorkflowSettingsTab';
import type { Member, Project } from '../../store/types';

export default function ProjectSettingsPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId, projectKey } = useParams<{ orgId: string; projectKey: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  const tabParam = searchParams.get('tab');
  const activeTab: 'general' | 'workflow' = tabParam === 'workflow' ? 'workflow' : 'general';

  const [localProject, setLocalProject] = useState<Project | null>(null);
  const currentProject = localProject || project;
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  const handleTabChange = (tab: 'general' | 'workflow') => {
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
        <nav className="flex items-center border-b border-slate-200 gap-2" aria-label={t('projects.settingsTabs', { defaultValue: 'Settings Tabs' })}>
          <button
            type="button"
            aria-current={activeTab === 'general' ? 'page' : undefined}
            onClick={() => handleTabChange('general')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Sliders className="h-4 w-4" aria-hidden="true" />
            {t('projects.generalTab')}
          </button>

          <button
            type="button"
            aria-current={activeTab === 'workflow' ? 'page' : undefined}
            onClick={() => handleTabChange('workflow')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeTab === 'workflow'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Workflow className="h-4 w-4" aria-hidden="true" />
            {t('projects.workflowTab')}
          </button>
        </nav>

        {/* Tab Panels */}
        <div className="pt-2">
          {activeTab === 'general' && (
            <GeneralSettingsTab
              project={currentProject}
              currentOrgId={currentOrgId || ''}
              isAdmin={isAdmin}
              onProjectUpdated={(updated) => setLocalProject(updated)}
            />
          )}

          {activeTab === 'workflow' && <WorkflowSettingsTab projectId={projectId} isAdmin={isAdmin} />}
        </div>
      </div>
    </ProjectPageShell>
  );
}
