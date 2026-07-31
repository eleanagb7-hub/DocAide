import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../types';
import { Spinner } from '../lib/ui';

export default function ProtectedRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(profile.role)) {
    const home = `/${profile.role}`;
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
