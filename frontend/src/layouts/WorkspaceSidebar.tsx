import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store';
import { setActiveOrg } from '../store/slices/orgSlice';
import { setActiveProject } from '../store/slices/projectSlice';
import {
  Kanban,
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  ChevronDown,
  Plus,
  X,
  Briefcase,
  Home,
  Map,
  SquareKanban,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

interface WorkspaceSidebarProps {
  closeMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SidebarNavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string | number;
  isCollapsed?: boolean;
}

function SidebarNavItem({ to, icon: Icon, label, isActive, onClick, badge, isCollapsed }: SidebarNavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`flex items-center gap-2.5 rounded-lg text-sm transition-all duration-150 ${
        isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
      } ${
        isActive
          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
      {!isCollapsed && <span className="truncate flex-1">{label}</span>}
      {!isCollapsed && badge !== undefined && (
        <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function WorkspaceSidebar({ closeMobileMenu, isCollapsed = false, onToggleCollapse }: WorkspaceSidebarProps) {
  const { t } = useTranslation('workspace');
  const { list: orgs, activeOrgId } = useAppSelector((state) => state.org);
  const { list: projects, activeProjectId } = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { orgId, projectKey } = useParams<{ orgId?: string; projectKey?: string }>();

  const activeOrg = orgs.find((o) => o.id === activeOrgId || o.slug === orgId || o.id === orgId) || orgs[0];
  const orgSlug = activeOrg?.slug || activeOrg?.id || orgId || 'default';

  const activeProject = projects.find(
    (p) => (activeProjectId && p.id === activeProjectId) || (projectKey && p.key === projectKey)
  );
  const currentProjectKey = activeProject?.key || projectKey;

  const getInitials = (name?: string) => {
    if (!name) return 'FB';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside
      className={`bg-[#0b1120] text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-800 select-none z-20 transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Bar / Logo */}
      <div className={`h-14 border-b border-slate-800 flex items-center shrink-0 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              if (onToggleCollapse) {
                e.preventDefault();
                onToggleCollapse();
              }
            }}
            className="bg-blue-600 hover:bg-blue-500 p-1.5 rounded-lg text-white flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer outline-none"
            title={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
            aria-label="Toggle sidebar"
          >
            <Kanban className="h-5 w-5" />
          </button>
          {!isCollapsed && (
            <Link
              to="/workspace"
              className="font-bold text-lg text-white tracking-tight truncate hover:text-blue-400 transition-colors"
              onClick={closeMobileMenu}
            >
              FlowBoard
            </Link>
          )}
        </div>
        {closeMobileMenu && (
          <button
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={closeMobileMenu}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-5 text-sm font-medium">
        
        {/* SECTION 1: GLOBAL SCOPE (Workspace Home) */}
        <div className="space-y-1">
          <SidebarNavItem
            to="/workspace"
            icon={Home}
            label={t('sidebar.workspaceHome')}
            isActive={
              location.pathname === '/workspace' ||
              location.pathname === '/workspace/' ||
              location.pathname === '/workspace/home'
            }
            onClick={closeMobileMenu}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800/80" />

        {/* SECTION 2: ORGANIZATION SCOPE */}
        <div className="space-y-2">
          {!isCollapsed && (
            <div className="px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('sidebar.organizationSection', { defaultValue: 'ORGANIZATION' })}
            </div>
          )}

          {/* Organization Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left outline-none">
              {isCollapsed ? (
                <div
                  className="w-10 h-10 mx-auto rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-center text-blue-400 font-bold text-xs border-blue-500/20"
                  title={activeOrg?.name || 'Organization'}
                >
                  {getInitials(activeOrg?.name)}
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                      {getInitials(activeOrg?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-200 truncate">
                        {activeOrg?.name || t('sidebar.selectOrganization')}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {activeOrg?.slug ? `@${activeOrg.slug}` : t('sidebar.organizationSection')}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 ml-1" />
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('sidebar.organizations')}
              </div>
              {orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => {
                    dispatch(setActiveOrg(org.id));
                    navigate(`/workspace/orgs/${org.slug || org.id}`);
                    closeMobileMenu?.();
                  }}
                  className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white flex items-center justify-between"
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrgId && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </DropdownMenuItem>
              ))}
              {orgs.length === 0 && (
                <div className="px-2 py-1 text-xs text-slate-500">{t('sidebar.noOrganizations')}</div>
              )}
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={() => {
                  navigate('/workspace/orgs/new');
                  closeMobileMenu?.();
                }}
                className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-blue-400 focus:text-blue-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('sidebar.createOrganization')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Org Navigation Items */}
          <div className="space-y-1">
            <SidebarNavItem
              to={`/workspace/orgs/${orgSlug}`}
              icon={LayoutDashboard}
              label={t('sidebar.overview')}
              isActive={
                location.pathname === `/workspace/orgs/${orgSlug}` ||
                location.pathname === `/workspace/orgs/${orgSlug}/` ||
                location.pathname === `/workspace/orgs/${orgSlug}/overview`
              }
              onClick={closeMobileMenu}
              isCollapsed={isCollapsed}
            />
            <SidebarNavItem
              to={`/workspace/orgs/${orgSlug}/projects`}
              icon={FolderKanban}
              label={t('sidebar.allProjects')}
              isActive={
                location.pathname === `/workspace/orgs/${orgSlug}/projects` ||
                location.pathname === `/workspace/orgs/${orgSlug}/projects/new`
              }
              onClick={closeMobileMenu}
              isCollapsed={isCollapsed}
            />
            <SidebarNavItem
              to={`/workspace/orgs/${orgSlug}/members`}
              icon={Users}
              label={t('sidebar.membersAndInvitations')}
              isActive={
                location.pathname === `/workspace/orgs/${orgSlug}/members` ||
                location.pathname === `/workspace/orgs/${orgSlug}/invitations`
              }
              onClick={closeMobileMenu}
              isCollapsed={isCollapsed}
            />
            <SidebarNavItem
              to={`/workspace/orgs/${orgSlug}/settings`}
              icon={Settings}
              label={t('sidebar.orgSettings')}
              isActive={location.pathname === `/workspace/orgs/${orgSlug}/settings`}
              onClick={closeMobileMenu}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800/80" />

        {/* SECTION 3: PROJECT SCOPE */}
        <div className="space-y-2">
          {!isCollapsed && (
            <div className="px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('sidebar.projectSection', { defaultValue: 'PROJECT' })}
            </div>
          )}

          {/* Project Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left outline-none">
              {isCollapsed ? (
                <div
                  className="w-10 h-10 mx-auto rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-center text-emerald-400 font-bold text-xs border-emerald-500/20"
                  title={activeProject?.name || 'Project'}
                >
                  <Briefcase className="h-4 w-4" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-200 truncate">
                        {activeProject?.name || t('sidebar.selectProject')}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {activeProject?.key ? `KEY: ${activeProject.key}` : t('sidebar.currentProject')}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 ml-1" />
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('sidebar.projects')}
              </div>
              {projects.map((proj) => (
                <DropdownMenuItem
                  key={proj.id}
                  onClick={() => {
                    dispatch(setActiveProject(proj.id));
                    navigate(`/workspace/orgs/${orgSlug}/projects/${proj.key}`);
                    closeMobileMenu?.();
                  }}
                  className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white flex items-center justify-between"
                >
                  <span className="truncate">{proj.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{proj.key}</span>
                </DropdownMenuItem>
              ))}
              {projects.length === 0 && (
                <div className="px-2 py-1 text-xs text-slate-500">{t('sidebar.selectProjectHint')}</div>
              )}
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/workspace/orgs/${orgSlug}/projects/new`);
                  closeMobileMenu?.();
                }}
                className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-blue-400 focus:text-blue-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('home.actions.createProject', { defaultValue: 'Tạo dự án mới' })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Project Navigation Items: Strictly 4 primary project links (Overview, Roadmap, Work, Settings) */}
          {currentProjectKey ? (
            <div className="space-y-1">
              <SidebarNavItem
                to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/overview`}
                icon={LayoutDashboard}
                label={t('sidebar.overview', { defaultValue: 'Overview' })}
                isActive={
                  location.pathname.includes(`/projects/${currentProjectKey}/overview`) ||
                  location.pathname === `/workspace/orgs/${orgSlug}/projects/${currentProjectKey}` ||
                  location.pathname === `/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/`
                }
                onClick={closeMobileMenu}
                isCollapsed={isCollapsed}
              />
              <SidebarNavItem
                to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/roadmap`}
                icon={Map}
                label={t('sidebar.roadmap', { defaultValue: 'Roadmap' })}
                isActive={location.pathname.includes(`/projects/${currentProjectKey}/roadmap`)}
                onClick={closeMobileMenu}
                isCollapsed={isCollapsed}
              />
              <SidebarNavItem
                to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/work`}
                icon={SquareKanban}
                label={t('sidebar.work', { defaultValue: 'Work' })}
                isActive={
                  location.pathname.includes(`/projects/${currentProjectKey}/work`) ||
                  location.pathname.includes(`/projects/${currentProjectKey}/issues`) ||
                  location.pathname.includes(`/projects/${currentProjectKey}/board`)
                }
                onClick={closeMobileMenu}
                isCollapsed={isCollapsed}
              />
              <SidebarNavItem
                to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/settings`}
                icon={Settings}
                label={t('sidebar.settings', { defaultValue: 'Settings' })}
                isActive={location.pathname.includes(`/projects/${currentProjectKey}/settings`)}
                onClick={closeMobileMenu}
                isCollapsed={isCollapsed}
              />
            </div>
          ) : (
            !isCollapsed && (
              <div className="px-3 py-2 text-xs text-slate-500 italic">
                {t('sidebar.selectProjectHint')}
              </div>
            )
          )}
        </div>

      </div>
    </aside>
  );
}

export default WorkspaceSidebar;
