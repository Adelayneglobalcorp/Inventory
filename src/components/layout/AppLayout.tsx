import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';

const wideMainForPath = (pathname: string) =>
  pathname === '/calculator' ||
  pathname === '/deals' ||
  pathname === '/project-manager' ||
  pathname.startsWith('/project-manager/');

const AppLayout = () => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const wideMain = wideMainForPath(pathname);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main
        className={
          wideMain
            ? 'mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4'
            : 'mx-auto max-w-7xl px-4 py-6'
        }
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
