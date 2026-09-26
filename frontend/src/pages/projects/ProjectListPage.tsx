import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProjects, setLoading } from '../../store/slices/projectSlice';
import { getProjects } from '../../services/projectService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { Plus, Search, ChevronRight, Users, Layers, X, FolderPlus, AlertCircle, RotateCw } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';

export default function ProjectListPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { list: projects, loading } = useAppSelector((state) => state.project);
  
  const searchQuery = searchParams.get('search') || '';
  const [isError, setIsError] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!orgId) return;
    dispatch(setLoading(true));
    setIsError(false);
    try {
      const data = await getProjects(orgId);
      dispatch(setProjects(data));
    } catch {
      setIsError(true);
      toast.error(t('common:status.error'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [orgId, dispatch, t]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        fetchProjects();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchProjects]);

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set('search', value.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  };

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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{t('projects.title')}</h1>
            {!loading && !isError && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {projects.length}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('projects.subtitle')}
          </p>
        </div>
        <Button onClick={handleCreateProject} className="shrink-0 gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          {t('projects.createProject')}
        </Button>
      </div>

      {/* Toolbar: Search and Filter */}
      {!loading && !isError && (projects.length > 0 || searchQuery) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-200/80">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={t('projects.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-8 bg-white border-slate-200 text-sm"
              aria-label={t('projects.searchPlaceholder')}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 w-full sm:w-auto text-right">
            {filteredProjects.length} / {projects.length}
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
      ) : isError ? (
        /* Error State with Retry Button */
        <EmptyState
          icon={AlertCircle}
          title={t('common:status.error')}
          description={t('common:emptyState.noData')}
          action={
            <Button onClick={fetchProjects} className="gap-2">
              <RotateCw className="h-4 w-4" />
              {t('common:buttons.retry')}
            </Button>
          }
          className="my-12 py-16"
        />
      ) : projects.length === 0 ? (
        /* Empty State: No Projects Created */
        <EmptyState
          icon={FolderPlus}
          title={t('orgDashboard.noProjects')}
          description={t('projects.createSubtitle')}
          action={
            <Button onClick={handleCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('projects.createProject')}
            </Button>
          }
          className="my-12 py-16"
        />
      ) : filteredProjects.length === 0 ? (
        /* Empty State: Search Filter No Results */
        <EmptyState
          icon={Search}
          title={t('common:emptyState.noResults')}
          description={t('projects.emptyState')}
          action={
            <Button variant="outline" onClick={() => handleSearchChange('')} className="gap-2">
              {t('common:buttons.cancel')}
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
            const boardUrl = `/workspace/orgs/${orgId}/projects/${projectKey}/issues`;

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
                      {project.status || t('common:status.active')}
                    </SemanticBadge>
                  </div>

                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      <Link
                        to={boardUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded"
                      >
                        {project.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                      {project.description || ''}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="py-2">
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5" title="Issues count">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>{issueCount} {t('sidebar.issues')}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Members count">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{memberCount} {t('sidebar.members')}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-slate-100 pt-3 pb-3 bg-slate-50/40 flex items-center justify-between text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/orgs/${orgId}/projects/${projectKey}/members`);
                      }}
                      aria-label={`${t('sidebar.members')} - ${project.name}`}
                      className="hover:text-indigo-600 hover:underline text-slate-500 transition-colors"
                    >
                      {t('sidebar.members')}
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/orgs/${orgId}/projects/${projectKey}/settings`);
                      }}
                      aria-label={`${t('sidebar.settings')} - ${project.name}`}
                      className="hover:text-indigo-600 hover:underline text-slate-500 transition-colors"
                    >
                      {t('sidebar.settings')}
                    </button>
                  </div>

                  <Link
                    to={boardUrl}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${t('sidebar.board')} - ${project.name}`}
                    className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>{t('sidebar.board')}</span>
                    <ChevronRight className="h-4 w-4 ml-0.5" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
