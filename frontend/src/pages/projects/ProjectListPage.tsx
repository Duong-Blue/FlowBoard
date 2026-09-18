import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProjects, setLoading } from '../../store/slices/projectSlice';
import { getProjects } from '../../services/projectService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { Plus, Search, ChevronRight, Users, Layers, X, FolderPlus } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';

export default function ProjectListPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { list: projects, loading } = useAppSelector((state) => state.project);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.key && p.key.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  const handleCreateProject = () => {
    if (orgId) {
      navigate(`/workspace/orgs/${orgId}/projects/new`);
    }
  };

  const handleOpenProjectBoard = (projectKey?: string) => {
    if (orgId && projectKey) {
      navigate(`/workspace/orgs/${orgId}/projects/${projectKey}/issues`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Your Projects</h1>
            {!loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {projects.length}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage, track, and collaborate on projects across your organization.
          </p>
        </div>
        <Button onClick={handleCreateProject} className="shrink-0 gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Toolbar: Search and Filter */}
      {projects.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-200/80">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Filter by name, key, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-white border-slate-200 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 w-full sm:w-auto text-right">
            Showing {filteredProjects.length} of {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="animate-pulse border-slate-200 bg-white">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-slate-200" />
                  <div className="h-5 w-16 rounded bg-slate-200" />
                </div>
                <div className="h-5 w-3/4 rounded bg-slate-200 mt-2" />
                <div className="h-4 w-full rounded bg-slate-100" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-2/3 rounded bg-slate-100" />
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="h-4 w-12 rounded bg-slate-100" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty State: No Projects Created */
        <EmptyState
          icon={FolderPlus}
          title="No projects created yet"
          description="Get started by creating your first project to organize tasks, track issues, and collaborate with your team."
          action={
            <Button onClick={handleCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          }
          className="my-12 py-16"
        />
      ) : filteredProjects.length === 0 ? (
        /* Empty State: Search Filter No Results */
        <EmptyState
          icon={Search}
          title="No matching projects"
          description={`No projects match your filter query "${searchQuery}". Try searching with a different term or clear the filter.`}
          action={
            <Button variant="outline" onClick={() => setSearchQuery('')} className="gap-2">
              Clear Filter
            </Button>
          }
          className="my-12 py-12"
        />
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const projectKey = project.key || project.id;
            const issueCount = project.issueCount ?? project._count?.issues ?? 0;
            const memberCount = project.memberCount ?? project._count?.members ?? 1;

            return (
              <Card
                key={project.id}
                onClick={() => handleOpenProjectBoard(project.key)}
                className="group relative cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-sm shadow-sm tracking-wider">
                        {(project.key || project.name.substring(0, 2)).substring(0, 3).toUpperCase()}
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {projectKey}
                      </span>
                    </div>
                    <SemanticBadge status={project.status || 'active'}>
                      {project.status || 'Active'}
                    </SemanticBadge>
                  </div>

                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                      {project.description || 'No description provided for this project.'}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="py-2">
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5" title="Issues count">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>{issueCount} {issueCount === 1 ? 'issue' : 'issues'}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Members count">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-slate-100 pt-3 pb-3 bg-slate-50/40 flex items-center justify-between text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/workspace/orgs/${orgId}/projects/${projectKey}/members`)}
                      className="hover:text-indigo-600 hover:underline text-slate-500 transition-colors"
                    >
                      Members
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => navigate(`/workspace/orgs/${orgId}/projects/${projectKey}/settings`)}
                      className="hover:text-indigo-600 hover:underline text-slate-500 transition-colors"
                    >
                      Settings
                    </button>
                  </div>

                  <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Board</span>
                    <ChevronRight className="h-4 w-4 ml-0.5" />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
