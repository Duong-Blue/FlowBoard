import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { LanguageSwitcher } from '../components/shared/LanguageSwitcher';

export default function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (
    isAuthenticated &&
    location.pathname !== '/oauth/callback' &&
    location.pathname !== '/invitations/accept'
  ) {
    const from = location.state?.from || '/workspace';

    return <Navigate to={from} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
