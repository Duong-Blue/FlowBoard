import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { LanguageSwitcher } from '../components/shared/LanguageSwitcher';

export default function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If the user is authenticated and tries to access auth routes, redirect them to /workspace
  // or to the location they were trying to reach if it's available.
  if (isAuthenticated) {
    const fromPath = location.state?.from?.pathname;
    const fromSearch = location.state?.from?.search;
    const from = fromPath + fromSearch || '/workspace';

    return <Navigate to={from} replace />;
  }

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] items-center justify-center py-8">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
