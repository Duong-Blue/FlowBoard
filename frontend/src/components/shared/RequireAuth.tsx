import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { type RootState } from '@/store/types';

export function RequireAuth() {
  const location = useLocation();
  const isAuthenticated = useAppSelector((state: RootState) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // for their first visit.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
