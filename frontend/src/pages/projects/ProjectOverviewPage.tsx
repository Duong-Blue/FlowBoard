import { useTranslation } from 'react-i18next';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { PageLoader } from '@/components/shared/PageLoader';
import NotFound from '../NotFound';
import { LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProjectOverviewPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { project, loading: projectLoading, is404 } = useResolvedProject();

  if (projectLoading) return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading...' })} />;
  if (is404 || !project) return <NotFound />;

  return (
    <ProjectPageShell project={project} title={project.name} subtitle={project.description || 'Project Overview'}>
      <div className="p-6 space-y-6 max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Project Key</CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.key}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{project.status || 'Active'}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About this Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {project.description || 'No description provided for this project yet.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </ProjectPageShell>
  );
}

export default ProjectOverviewPage;
