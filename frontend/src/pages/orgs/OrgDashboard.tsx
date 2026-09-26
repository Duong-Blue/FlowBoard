import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { setOrgs, setActiveOrg } from '../../store/slices/orgSlice';
import * as orgService from '../../services/orgService';
import * as projectService from '../../services/projectService';
import * as memberService from '../../services/memberService';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';
import {
  Building2,
  FolderKanban,
  Users,
  Plus,
  ArrowRight,
  Activity,
  Clock,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import type { Organization, Project, Member } from '../../store/types';

export default function OrgDashboard() {
  const { t } = useTranslation(['workspace', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orgId: paramOrgId } = useParams<{ orgId?: string }>();
  const { list: orgs, activeOrgId, loading: orgsLoading } = useAppSelector((state) => state.org);

  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (orgs.length === 0) {
      const fetchOrgs = async () => {
        try {
          const data = await orgService.getOrgs();
          dispatch(setOrgs(data));
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : t('common:status.error'));
        }
      };
      fetchOrgs();
    }
  }, [dispatch, orgs.length, t]);

  useEffect(() => {
    if (orgs.length === 0) return;

    let foundOrg: Organization | undefined;
    if (paramOrgId) {
      foundOrg = orgs.find((o) => o.slug === paramOrgId || o.id === paramOrgId);
    }
    if (!foundOrg && activeOrgId) {
      foundOrg = orgs.find((o) => o.id === activeOrgId);
    }
    if (!foundOrg) {
      foundOrg = orgs[0];
    }

    if (foundOrg) {
      setActiveOrgState(foundOrg);
      if (foundOrg.id !== activeOrgId) {
        dispatch(setActiveOrg(foundOrg.id));
      }
    }
  }, [paramOrgId, activeOrgId, orgs, dispatch]);

  useEffect(() => {
    if (!activeOrg?.id) return;

    let isMounted = true;
    const fetchOrgData = async () => {
      setDataLoading(true);
      setError('');
      try {
        const [projectsData, membersData] = await Promise.all([
          projectService.getProjects(activeOrg.id),
          memberService.getOrgMembers(activeOrg.id),
        ]);

        if (isMounted) {
          setProjects(projectsData || []);
          setMembers(membersData || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load organization dashboard details:', err);
          setError(err instanceof Error ? err.message : t('common:status.error'));
        }
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    fetchOrgData();

    return () => {
      isMounted = false;
    };
  }, [activeOrg?.id, t]);

  if (orgsLoading || (dataLoading && !activeOrg)) {
    return <PageLoader text={t('common:status.loading')} className="min-h-[400px]" />;
  }

  if (!activeOrg && orgs.length === 0 && !dataLoading) {
    return (
      <EmptyState
        icon={Building2}
        title={t('sidebar.noOrganizations')}
        description={t('createOrg.subtitle')}        action={
          <Button onClick={() => navigate('/workspace/orgs/new')}>
            <Plus className="mr-2 h-4 w-4" /> {t('createOrg.title')}          </Button>
        }
      />
    );
  }

  const orgKey = activeOrg?.slug || activeOrg?.id || '';
  const initialBadge = activeOrg?.name ? activeOrg.name.charAt(0).toUpperCase() : 'O';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            {activeOrg?.logoUrl ? (
              <img
                src={activeOrg.logoUrl}
                alt={activeOrg.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white font-bold text-3xl flex items-center justify-center ring-2 ring-white/20 shadow-lg shrink-0">
                {initialBadge}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{activeOrg?.name}</h1>
                {activeOrg?.slug && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                    {activeOrg.slug}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-sm max-w-2xl">
                {activeOrg?.description || t('orgDashboard.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-colors"
              onClick={() => navigate(`/workspace/orgs/${orgKey}/members`)}
            >
              <Users className="mr-2 h-4 w-4 text-indigo-300" />
              {t('sidebar.members')}
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-md transition-all"
              onClick={() => navigate(`/workspace/orgs/${orgKey}/projects/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('orgDashboard.createProject')}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          onClick={() => navigate(`/workspace/orgs/${orgKey}/projects`)}
          className="group relative bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{t('orgDashboard.totalProjects')}</span>
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FolderKanban className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900">
              {dataLoading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                projects.length
              )}
            </div>
            <span className="text-xs font-medium text-indigo-600 flex items-center group-hover:translate-x-0.5 transition-transform">
              {t('orgDashboard.viewAllProjects')} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate(`/workspace/orgs/${orgKey}/members`)}
          className="group relative bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{t('orgDashboard.totalMembers')}</span>
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900">
              {dataLoading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                members.length
              )}
            </div>
            <span className="text-xs font-medium text-purple-600 flex items-center group-hover:translate-x-0.5 transition-transform">
              {t('orgDashboard.manageMembers')} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate(`/workspace/orgs/${orgKey}/settings`)}
          className="group relative bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{t('sidebar.settings')}</span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('common:status.active')}
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 flex items-center">
              {t('sidebar.settings')} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('orgDashboard.recentProjects')}</h2>
            </div>
            <Link
              to={`/workspace/orgs/${orgKey}/projects`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              {t('orgDashboard.viewAllProjects')} ({projects.length}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-5 border rounded-xl bg-white space-y-3 animate-pulse">
                  <div className="h-5 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 border-dashed rounded-xl space-y-3">
              <FolderKanban className="mx-auto h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-900">{t('orgDashboard.noProjects')}</p>
              <Button
                size="sm"
                onClick={() => navigate(`/workspace/orgs/${orgKey}/projects/new`)}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" /> {t('orgDashboard.createProject')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() =>
                    navigate(
                      `/workspace/orgs/${orgKey}/projects/${project.key || project.id}/issues`
                    )
                  }
                  className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      {project.key && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          {project.key}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                      {project.description || ''}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <SemanticBadge status={project.status || 'active'}>
                      {project.status || t('common:status.active')}
                    </SemanticBadge>

                    <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
                      {t('sidebar.board')} <ExternalLink className="ml-1 h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('sidebar.activity')}</h2>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            {dataLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                <div className="relative group">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div>
                    <p className="text-xs font-medium text-slate-900">{activeOrg?.name}</p>
                    <span className="text-[10px] text-slate-400 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1 inline" /> {t('common:status.active')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
