import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store';

export default function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-lg">
        <Outlet />
      </div>
    </div>
  );
}
