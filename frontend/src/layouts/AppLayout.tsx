import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { AppBreadcrumb } from '../components/shared/AppBreadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

function NavItem({ to, children, isActive, onClick }: { to: string; children: React.ReactNode; isActive?: boolean; onClick?: () => void }) {
  const location = useLocation();
  const isCurrent = isActive ?? location.pathname.startsWith(to);
  return (
    <Link 
      to={to} 
      className={`block px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
        isCurrent 
          ? 'bg-slate-200/60 text-slate-900 font-semibold' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export default function AppLayout() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { list: orgs, activeOrgId } = useAppSelector((state) => state.org);
  const { list: projects, activeProjectId } = useAppSelector((state) => state.project);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch('http://localhost:3000/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.name || user?.email || 'User';
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex bg-white">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4">
          <Link to="/" className="font-semibold text-lg flex items-center">
            FlowBoard
          </Link>
          <button 
            className="lg:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-3 border-b border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Organization</div>
          {orgs.map((org) => (
            <NavItem 
              key={org.id} 
              to={`/orgs/${org.slug || org.id}/projects`}
              isActive={activeOrgId === org.id}
              onClick={closeMobileMenu}
            >
              {org.name}
            </NavItem>
          ))}
          {orgs.length === 0 && (
            <div className="text-sm text-slate-500 px-3">No organizations</div>
          )}
        </div>
        
        <div className="flex-1 p-3 overflow-y-auto space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Projects</div>
          {projects.map((project) => {
            const currentOrg = orgs.find(o => o.id === (activeOrgId || project.orgId));
            const orgSlug = currentOrg?.slug || activeOrgId || project.orgId;
            const projectKey = project.key || project.id;
            const isProjectActive = activeProjectId === project.id || location.pathname.includes(`/projects/${projectKey}`) || location.pathname.includes(`/projects/${project.id}`);
            const projectPath = `/orgs/${orgSlug}/projects/${projectKey}/issues`;
            return (
              <div key={project.id} className="space-y-0.5">
                <NavItem 
                  to={projectPath}
                  isActive={isProjectActive}
                  onClick={closeMobileMenu}
                >
                  {project.name}
                </NavItem>
                {isProjectActive && (
                  <div className="pl-3 space-y-0.5 border-l-2 border-slate-200 ml-2.5 my-1">
                    <NavItem 
                      to={`/orgs/${orgSlug}/projects/${projectKey}/issues`} 
                      isActive={location.pathname.endsWith('/issues')}
                      onClick={closeMobileMenu}
                    >
                      Kanban / Issues
                    </NavItem>
                    <NavItem 
                      to={`/orgs/${orgSlug}/projects/${projectKey}/members`} 
                      isActive={location.pathname.endsWith('/members')}
                      onClick={closeMobileMenu}
                    >
                      Members
                    </NavItem>
                    <NavItem 
                      to={`/orgs/${orgSlug}/projects/${projectKey}/settings`} 
                      isActive={location.pathname.endsWith('/settings')}
                      onClick={closeMobileMenu}
                    >
                      Settings
                    </NavItem>
                  </div>
                )}
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="text-sm text-slate-500 px-3">No projects</div>
          )}
        </div>
        
        <div className="p-3 border-t border-slate-200">
           <NavItem to="/settings" isActive={location.pathname === '/settings'} onClick={closeMobileMenu}>
             Settings
           </NavItem>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0">
          <button 
            className="lg:hidden p-2 -ml-2 mr-2 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex-1 flex items-center text-sm text-slate-500">
             <div className="hidden sm:block"><AppBreadcrumb /></div>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-md transition-colors outline-none">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block">{displayName}</span>
                <ChevronDown size={16} className="text-slate-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {displayName}
                  <div className="text-xs text-slate-500 font-normal">{user?.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer w-full">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

