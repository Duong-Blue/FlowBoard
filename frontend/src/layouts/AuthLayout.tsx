import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store';

export default function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
