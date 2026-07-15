import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Shield } from "@/lib/icons";
import { useState, type ReactNode } from "react";

function ProfileLoadError() {
  const { t } = useTranslation();
  const { refreshProfile, signOut, user } = useAuth();

  return (
    <div className="flex min-h-screen min-h-dvh flex-col items-center justify-center bg-gradient-void px-4">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-6 text-center shadow-xl backdrop-blur-xl">
        <h1 className="font-display text-lg font-semibold text-foreground">
          {t("dashboard.profileLoadErrorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("dashboard.profileLoadErrorDesc")}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => {
              if (user?.id) void refreshProfile(user.id);
            }}
          >
            {t("errors.tryAgain")}
          </Button>
          <Button variant="outline" onClick={() => void signOut()}>
            {t("common.signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountSuspendedScreen() {
  const { t } = useTranslation();
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  const recheckAccess = async () => {
    if (!user?.id) return;
    setChecking(true);
    try {
      await refreshProfile(user.id);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen min-h-dvh flex-col items-center justify-center bg-gradient-void px-4">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-2xl border border-red-500/25 bg-card/80 p-6 text-center shadow-xl backdrop-blur-xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
          <Shield className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-display text-lg font-semibold text-foreground">
          {t("admin.accountSuspendedTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("admin.accountSuspendedDesc")}</p>
        {profile?.suspension_reason && (
          <div className="mt-4 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t("admin.accountSuspendedReason")}
            </p>
            <p className="mt-1 text-sm text-foreground">{profile.suspension_reason}</p>
          </div>
        )}
        <p className="mt-4 text-xs text-muted">{t("admin.accountSuspendedHelp")}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => void recheckAccess()} disabled={checking}>
            {checking ? t("common.loading") : t("admin.accountSuspendedRecheck")}
          </Button>
          <Button variant="outline" onClick={() => void signOut()}>
            {t("common.signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, profileStatus, sessionExpired } = useAuth();
  const location = useLocation();

  if (loading) {
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

  if (!profile && profileStatus === "error") {
    return <ProfileLoadError />;
  }

  if (!profile) {
    return <LoadingScreen fullScreen />;
  }

  if (profile.is_suspended && profile.role !== "admin") {
    return <AccountSuspendedScreen />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, profileStatus } = useAuth();

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  if (!user) {
    return <Navigate to="/admin-auth" replace />;
  }

  if (!profile && profileStatus === "error") {
    return <ProfileLoadError />;
  }

  if (!profile) {
    return <LoadingScreen fullScreen />;
  }

  if (profile.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, profileStatus, sessionExpired } = useAuth();

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  if (!user) {
    return <Navigate to="/admin-auth" state={{ sessionExpired }} replace />;
  }

  if (!profile && profileStatus === "error") {
    return <ProfileLoadError />;
  }

  if (!profile) {
    return <LoadingScreen fullScreen />;
  }

  return <>{children}</>;
}
