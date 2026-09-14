import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

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

  const NavLink = ({ to, children, isActive }: { to: string, children: React.ReactNode, isActive?: boolean }) => {
    const isCurrent = isActive ?? location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
          isCurrent 
            ? 'bg-slate-100 text-slate-900 font-semibold' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4">
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
        
        <div className="p-4 border-b border-slate-200 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Organization</div>
          {orgs.map((org) => (
            <NavLink 
              key={org.id} 
              to={`/orgs/${org.id}`}
              isActive={activeOrgId === org.id}
            >
              {org.name}
            </NavLink>
          ))}
          {orgs.length === 0 && (
            <div className="text-sm text-slate-500 px-3">No organizations</div>
          )}
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Projects</div>
          {projects.map((project) => (
            <NavLink 
              key={project.id} 
              to={`/projects/${project.id}`}
              isActive={activeProjectId === project.id}
            >
              {project.name}
            </NavLink>
          ))}
          {projects.length === 0 && (
            <div className="text-sm text-slate-500 px-3">No projects</div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200">
           <NavLink to="/settings" isActive={location.pathname === '/settings'}>
             Settings
           </NavLink>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0">
          <button 
            className="lg:hidden p-2 -ml-2 mr-2 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex-1 flex items-center text-sm text-slate-500">
             <div className="hidden sm:block">Breadcrumb goes here</div>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-md transition-colors outline-none">
                <Avatar className="h-8 w-8">
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
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
