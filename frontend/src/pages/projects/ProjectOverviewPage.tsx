import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { PageLoader } from '@/components/shared/PageLoader';
import NotFound from '../NotFound';
import { LayoutDashboard, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getProjectSummary } from '@/services/projectService';
import { milestoneService, type Milestone } from '@/services/milestoneService';

export function ProjectOverviewPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { project, loading: projectLoading, is404 } = useResolvedProject();
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['projectSummary', project?.id],
    queryFn: () => (project ? getProjectSummary(project.id) : null),
    enabled: !!project,
  });

  useEffect(() => {
    if (project?.id) {
        milestoneService.getAll(project.id).then(setMilestones);
    }
  }, [project?.id]);

  if (projectLoading || summaryLoading) return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading...' })} />;
  if (is404 || !project) return <NotFound />;

  const summaryData = (summary as any)?.data || {};
  const metrics = summaryData.metrics || { totalIssues: 0, completedIssues: 0, inProgressIssues: 0, overdueIssues: 0, progressPercentage: 0 };

  return (
    <ProjectPageShell project={project} title={project.name} subtitle={project.description || 'Project Overview'}>
      <div className="p-6 space-y-6 max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Total Issues</CardTitle><LayoutDashboard className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.totalIssues}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-emerald-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.completedIssues}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">In Progress</CardTitle><TrendingUp className="h-4 w-4 text-blue-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.inProgressIssues}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Overdue</CardTitle><AlertCircle className="h-4 w-4 text-red-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{metrics.overdueIssues}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Project Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
              <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.round(metrics.progressPercentage)}%` }} />
              </div>
            <p className="text-sm text-muted-foreground">{Math.round(metrics.progressPercentage)}% Complete</p>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Milestone Snapshot</CardTitle></CardHeader>
            <CardContent>
                {milestones.length > 0 ? (
                    <div className="space-y-4">
                        {milestones.slice(0, 3).map(m => (
                            <div key={m.id} className="flex justify-between items-center">
                                <span>{m.name}</span>
                                <div className="w-1/2 bg-gray-200 h-2 rounded">
                                    <div className="bg-blue-600 h-2 rounded" style={{ width: `${m.progress}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No active milestones.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </ProjectPageShell>
  );
}

export default ProjectOverviewPage;
