import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProjects, setLoading } from '../../store/slices/projectSlice';
import { getProjects } from '../../services/projectService';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function ProjectListPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { list: projects, loading } = useAppSelector((state) => state.project);

  useEffect(() => {
    if (!orgId) return;

    const fetchProjects = async () => {
      dispatch(setLoading(true));
      try {
        const data = await getProjects(orgId);
        dispatch(setProjects(data));
      } catch (error) {
        toast.error('Failed to fetch projects');
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchProjects();
  }, [orgId, dispatch]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage projects in your organization.</p>
        </div>
        <Button onClick={() => navigate(`/orgs/${orgId}/projects/new`)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-md border border-dashed text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No projects created</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              You haven't created any projects yet. Start by creating your first project.
            </p>
            <Button onClick={() => navigate(`/orgs/${orgId}/projects/new`)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/orgs/${orgId}/projects/${project.id}/members`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
                <Badge variant="secondary" className="uppercase font-mono">
                  {project.key}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 min-h-[40px] mt-2">
                  {project.description || 'No description provided.'}
                </CardDescription>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status || 'Active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
