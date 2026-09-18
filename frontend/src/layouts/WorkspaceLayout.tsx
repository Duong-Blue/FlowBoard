import { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '../store';
import { getOrgs } from '../services/orgService';
import { getProjects } from '../services/projectService';
import { setOrgs, setActiveOrg, setLoading as setOrgLoading } from '../store/slices/orgSlice';
import { setProjects, setActiveProject, setLoading as setProjectLoading } from '../store/slices/projectSlice';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { Menu } from 'lucide-react';
import { AppBreadcrumb } from '../components/shared/AppBreadcrumb';
import { NotificationCenter } from '../components/shared/NotificationCenter';

export default function WorkspaceLayout() {
  const dispatch = useAppDispatch();
  const { list: orgs, activeOrgId } = useAppSelector((state) => state.org);
  const { list: projects, activeProjectId } = useAppSelector((state) => state.project);

  const { orgId, projectKey } = useParams<{ orgId?: string; projectKey?: string }>();
  const [isInit, setIsInit] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Safely fetch organizations on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOrgs = async () => {
      dispatch(setOrgLoading(true));
      try {
        const data = await getOrgs();
        if (isMounted) {
          dispatch(setOrgs(data));
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to fetch organizations');
      } finally {
        if (isMounted) {
          dispatch(setOrgLoading(false));
          setIsInit(true);
        }
      }
    };

    fetchOrgs();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // 2. Hydrate Redux activeOrgId from URL parameter orgId
  useEffect(() => {
    if (orgs.length === 0) return;

    if (orgId) {
      const matchedOrg = orgs.find((o) => o.slug === orgId || o.id === orgId);
      if (matchedOrg) {
        if (matchedOrg.id !== activeOrgId) {
          dispatch(setActiveOrg(matchedOrg.id));
        }
      }
    } else if (!activeOrgId && orgs.length > 0) {
      dispatch(setActiveOrg(orgs[0].id));
    }
  }, [orgId, orgs, activeOrgId, dispatch]);

  // 3. Safely fetch projects when activeOrgId changes
  useEffect(() => {
    if (!activeOrgId) return;

    let isMounted = true;
    const fetchProjects = async () => {
      dispatch(setProjectLoading(true));
      try {
        const data = await getProjects(activeOrgId);
        if (isMounted) {
          dispatch(setProjects(data));
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to fetch projects');
      } finally {
        if (isMounted) {
          dispatch(setProjectLoading(false));
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [activeOrgId, dispatch]);

  // 4. Hydrate Redux activeProjectId matching strictly p.key === projectKey (no fallback to p.id)
  useEffect(() => {
    if (projects.length === 0 || !projectKey) return;

    const matchedProject = projects.find((p) => p.key === projectKey);
    if (matchedProject) {
      if (matchedProject.id !== activeProjectId) {
        dispatch(setActiveProject(matchedProject.id));
      }
    }
  }, [projectKey, projects, activeProjectId, dispatch]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static h-screen shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <WorkspaceSidebar closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0 justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <AppBreadcrumb />
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white">
          <Outlet context={{ isInit }} />
        </div>
      </main>
    </div>
  );
}
