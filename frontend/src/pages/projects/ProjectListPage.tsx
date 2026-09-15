import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProjects, setLoading } from '../../store/slices/projectSlice';
import { getProjects } from '../../services/projectService';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';

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
      } catch {
        toast.error('Failed to fetch projects');
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchProjects();
  }, [orgId, dispatch]);

  if (loading) {
    return <PageLoader />;
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
        <EmptyState
          icon={PlusCircle}
          title="No projects created"
          description="You haven't created any projects yet. Start by creating your first project."
          action={
            <Button onClick={() => navigate(`/orgs/${orgId}/projects/new`)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Project Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">Key</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500 w-1/2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/orgs/${orgId}/projects/${project.id}/members`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {project.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {project.key}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SemanticBadge status={project.status || 'active'}>
                      {project.status || 'Active'}
                    </SemanticBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-xs">
                    {project.description || 'No description provided.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
