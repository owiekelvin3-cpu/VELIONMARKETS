import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, sessionExpired } = useAuth();
  const location = useLocation();

  if (loading || (user && !profile)) {
    return <LoadingScreen fullScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        state={{ from: location, sessionExpired }}
        replace
      />
    );
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  // Wait until profile is loaded — navigating right after sign-in can race
  // ahead of setProfile and incorrectly bounce admins back to /admin-auth.
  if (loading || (user && !profile)) {
    return <LoadingScreen fullScreen />;
  }

  if (!user || profile?.role !== "admin") {
    return <Navigate to="/admin-auth" replace />;
  }

  return <>{children}</>;
}

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, sessionExpired } = useAuth();

  if (loading || (user && !profile)) {
    return <LoadingScreen fullScreen />;
  }

  if (!user) {
    return <Navigate to="/admin-auth" state={{ sessionExpired }} replace />;
  }

  return <>{children}</>;
}
