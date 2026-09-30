import { useTranslation } from 'react-i18next';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { PageLoader } from '@/components/shared/PageLoader';
import NotFound from '../NotFound';
import { Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProjectRoadmapPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { project, loading: projectLoading, is404 } = useResolvedProject();

  if (projectLoading) return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading...' })} />;
  if (is404 || !project) return <NotFound />;

  return (
    <ProjectPageShell project={project} title="Roadmap" subtitle="Project timeline and milestones">
      <div className="p-6 space-y-6 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-500" />
              Project Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Roadmap planning and epic timelines for {project.name}.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProjectPageShell>
  );
}

export default ProjectRoadmapPage;
