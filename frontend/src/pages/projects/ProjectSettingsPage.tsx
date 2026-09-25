import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sliders, Workflow, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../store';
import { getOrgMembers, getProjectMembers } from '../../services/memberService';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/shared/PageLoader';
import NotFound from '../NotFound';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { GeneralSettingsTab } from '@/features/projects/components/GeneralSettingsTab';
import { WorkflowSettingsTab } from '@/features/projects/components/WorkflowSettingsTab';
import type { Member, Project } from '../../store/types';

export default function ProjectSettingsPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId, projectKey } = useParams<{ orgId: string; projectKey: string }>();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  const [activeTab, setActiveTab] = useState<'general' | 'workflow'>('general');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
  }, [project]);

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-slate-700" />
            Project Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage configuration, details, and workflow settings for <span className="font-semibold text-slate-700">{currentProject.name}</span>.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/workspace/orgs/${currentOrgId}/projects/${displayKey}/board`)}
          className="self-start sm:self-auto flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Button>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex items-center border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer outline-none ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Sliders className="h-4 w-4" />
          General Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer outline-none ${
            activeTab === 'workflow'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Workflow className="h-4 w-4" />
          Workflow Settings
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'general' && (
          <GeneralSettingsTab
            project={currentProject}
            currentOrgId={currentOrgId || ''}
            isAdmin={isAdmin}
            onProjectUpdated={(updated) => setCurrentProject(updated)}
          />
        )}

        {activeTab === 'workflow' && <WorkflowSettingsTab projectId={projectId} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
