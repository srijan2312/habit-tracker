import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading && !user) {
    return null;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={cn('flex-1 px-4 lg:px-0', sidebarOpen && 'lg:ml-64')}>
          <Suspense
            fallback={
              <div className="dashboard-bg min-h-[60vh] p-6" aria-live="polite" aria-busy="true">
                <div className="mx-auto w-full max-w-5xl space-y-4">
                  <div className="h-9 w-40 animate-pulse rounded-md bg-muted/60" />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="h-28 animate-pulse rounded-xl bg-card/70" />
                    <div className="h-28 animate-pulse rounded-xl bg-card/70" />
                    <div className="h-28 animate-pulse rounded-xl bg-card/70" />
                  </div>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};
