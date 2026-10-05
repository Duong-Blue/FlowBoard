import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { PageLoader } from '@/components/shared/PageLoader';
import NotFound from '../NotFound';
import { Map, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { milestoneService, type Milestone } from '@/services/milestoneService';
import { RoadmapTimeline } from '@/features/roadmap/components/RoadmapTimeline';
import { CreateMilestoneModal } from '@/features/roadmap/components/CreateMilestoneModal';
import { MilestoneDetailDrawer } from '@/features/roadmap/components/MilestoneDetailDrawer';

export function ProjectRoadmapPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { project, loading: projectLoading, is404 } = useResolvedProject();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const fetchMilestones = () => {
    if (project?.id) {
      milestoneService.getAll(project.id).then(setMilestones);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [project?.id]);

  if (projectLoading) return <PageLoader text={t('common:status.loading', { defaultValue: 'Loading...' })} />;
  if (is404 || !project) return <NotFound />;

  return (
    <>
      <div className="p-6 space-y-6 max-w-6xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-500" />
              Project Roadmap
            </CardTitle>
            <Button onClick={() => setIsCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Milestone
            </Button>
          </CardHeader>
          <CardContent>
             {milestones.length > 0 ? (
                <div onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const title = target.getAttribute('data-title');
                  if (title) {
                    const found = milestones.find(m => m.name === title);
                    if (found) setSelectedMilestone(found);
                  }
                }}>
                  <RoadmapTimeline milestones={milestones} />
                </div>
             ) : (
                <p>No milestones defined yet.</p>
             )}
          </CardContent>
        </Card>
      </div>

      <CreateMilestoneModal 
        projectId={project.id} 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={fetchMilestones} 
      />
      <MilestoneDetailDrawer 
        milestone={selectedMilestone} 
        isOpen={!!selectedMilestone} 
        onClose={() => setSelectedMilestone(null)} 
      />
    </>
  );
}

export default ProjectRoadmapPage;
