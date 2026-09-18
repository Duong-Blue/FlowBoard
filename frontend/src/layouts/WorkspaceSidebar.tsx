import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { setActiveOrg } from '../store/slices/orgSlice';
import {
  Kanban,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  Settings,
  ListTodo,
  Sliders,
  ChevronDown,
  ChevronRight,
  LogOut,
  Plus,
  X,
  Briefcase,
  Info,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

interface WorkspaceSidebarProps {
  closeMobileMenu?: () => void;
}

interface SidebarNavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

function SidebarNavItem({ to, icon: Icon, label, isActive, onClick, badge }: SidebarNavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        isActive
          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
      <span className="truncate flex-1">{label}</span>
      {badge !== undefined && (
        <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function WorkspaceSidebar({ closeMobileMenu }: WorkspaceSidebarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { list: orgs, activeOrgId } = useAppSelector((state) => state.org);
  const { list: projects, activeProjectId } = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { orgId, projectKey } = useParams<{ orgId?: string; projectKey?: string }>();

  const [isProjectSectionOpen, setIsProjectSectionOpen] = useState(true);

  const activeOrg = orgs.find((o) => o.id === activeOrgId || o.slug === orgId || o.id === orgId) || orgs[0];
  const orgSlug = activeOrg?.slug || activeOrg?.id || orgId || 'default';

  const activeProject = projects.find(
    (p) => (activeProjectId && p.id === activeProjectId) || (projectKey && p.key === projectKey)
  );
  const currentProjectKey = activeProject?.key || projectKey;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.name || user?.email || 'User';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    closeMobileMenu?.();
  };

  return (
    <aside className="w-64 bg-[#0b1120] text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-800 select-none z-20">
      {/* Top Bar / Logo */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <Link
          to="/workspace"
          className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight"
          onClick={closeMobileMenu}
        >
          <div className="bg-blue-600 p-1.5 rounded-lg text-white flex items-center justify-center">
            <Kanban className="h-5 w-5" />
          </div>
          <span>FlowBoard</span>
        </Link>
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
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-sm font-medium">
        {/* Organization Switcher Capsule */}
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full text-left outline-none">
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                  {getInitials(activeOrg?.name || 'FB')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-slate-200 truncate">
                    {activeOrg?.name || 'Select Organization'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {activeOrg?.slug ? `@${activeOrg.slug}` : 'Organization'}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 ml-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Organizations
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
              <div className="px-2 py-1 text-xs text-slate-500">No organizations found</div>
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
              Create Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Section 1: Organization Navigation */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Organization
          </div>
          <SidebarNavItem
            to={`/workspace/orgs/${orgSlug}`}
            icon={LayoutDashboard}
            label="Overview"
            isActive={
              location.pathname === `/workspace/orgs/${orgSlug}` ||
              location.pathname === `/workspace` ||
              location.pathname === `/workspace/`
            }
            onClick={closeMobileMenu}
          />
          <SidebarNavItem
            to={`/workspace/orgs/${orgSlug}/projects`}
            icon={FolderKanban}
            label="Projects"
            isActive={
              location.pathname === `/workspace/orgs/${orgSlug}/projects` ||
              location.pathname === `/workspace/orgs/${orgSlug}/projects/new`
            }
            onClick={closeMobileMenu}
          />
          <SidebarNavItem
            to={`/workspace/orgs/${orgSlug}`}
            icon={CheckSquare}
            label="My Work"
            onClick={closeMobileMenu}
          />
          <SidebarNavItem
            to={`/workspace/orgs/${orgSlug}/members`}
            icon={Users}
            label="Members"
            isActive={location.pathname === `/workspace/orgs/${orgSlug}/members`}
            onClick={closeMobileMenu}
          />
          <SidebarNavItem
            to={`/workspace/orgs/${orgSlug}/invitations`}
            icon={Activity}
            label="Activity"
            isActive={location.pathname === `/workspace/orgs/${orgSlug}/invitations`}
            onClick={closeMobileMenu}
          />
          <SidebarNavItem
            to={`/workspace/orgs/${orgSlug}/settings`}
            icon={Settings}
            label="Settings"
            isActive={location.pathname === `/workspace/orgs/${orgSlug}/settings`}
            onClick={closeMobileMenu}
          />
        </div>

        {/* Section 2: Current Project Navigation */}
        <div className="pt-2 space-y-1">
          <button
            type="button"
            onClick={() => setIsProjectSectionOpen(!isProjectSectionOpen)}
            className="w-full flex items-center justify-between px-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors select-none text-left"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activeProject ? activeProject.name : 'Current Project'}</span>
            </div>
            {isProjectSectionOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0 ml-1" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 ml-1" />
            )}
          </button>
          {isProjectSectionOpen && (
            <div className="space-y-1">
              {currentProjectKey ? (
                <>
                  <SidebarNavItem
                    to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}`}
                    icon={Info}
                    label="Project Overview"
                    isActive={
                      location.pathname === `/workspace/orgs/${orgSlug}/projects/${currentProjectKey}`
                    }
                    onClick={closeMobileMenu}
                  />
                  <SidebarNavItem
                    to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/issues?view=list`}
                    icon={ListTodo}
                    label="Issues"
                    isActive={
                      location.pathname.includes(`/projects/${currentProjectKey}`) &&
                      location.search.includes('view=list')
                    }
                    onClick={closeMobileMenu}
                  />
                  <SidebarNavItem
                    to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/issues`}
                    icon={Kanban}
                    label="Board"
                    isActive={
                      (location.pathname.includes(`/projects/${currentProjectKey}/issues`) ||
                        location.pathname.includes(`/projects/${currentProjectKey}/board`)) &&
                      !location.search.includes('view=list')
                    }
                    onClick={closeMobileMenu}
                  />
                  <SidebarNavItem
                    to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/members`}
                    icon={Users}
                    label="Members"
                    isActive={location.pathname.includes(`/projects/${currentProjectKey}/members`)}
                    onClick={closeMobileMenu}
                  />
                  <SidebarNavItem
                    to={`/workspace/orgs/${orgSlug}/projects/${currentProjectKey}/settings`}
                    icon={Sliders}
                    label="Settings"
                    isActive={location.pathname.includes(`/projects/${currentProjectKey}/settings`)}
                    onClick={closeMobileMenu}
                  />
                </>
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500 italic">
                  Select a project to view navigation
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer: User Profile Widget */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full text-left outline-none">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/70 transition-colors cursor-pointer">
              <Avatar className="h-9 w-9 border border-slate-700 shrink-0">
                <AvatarFallback className="bg-blue-600 text-white font-semibold text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{displayName}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
            <div className="px-2 py-1.5 text-xs text-slate-400">
              Signed in as <span className="font-semibold text-slate-200 truncate block">{displayName}</span>
            </div>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={() => {
                navigate('/workspace/settings');
                closeMobileMenu?.();
              }}
              className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-red-400 focus:text-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default WorkspaceSidebar;
