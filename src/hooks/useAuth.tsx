import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureValidSession, isJwtExpiredError } from "@/lib/auth-session";
import { autoEnablePushNotifications, setPushEnabledPreference } from "@/lib/push-notifications";
import type { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && isJwtExpiredError(error)) {
      const ok = await ensureValidSession();
      if (ok) {
        const retry = await supabase.from("profiles").select("*").eq("id", userId).single();
        setProfile(retry.data);
        return;
      }
      setSessionExpired(true);
      await supabase.auth.signOut();
      return;
    }

    setProfile(data);
  }, []);

  const refreshProfile = async (userId?: string) => {
    const id = userId ?? user?.id;
    if (id) await fetchProfile(id);
  };

  const clearSessionExpired = () => setSessionExpired(false);

  const handleSessionLoss = useCallback(async (expired = true) => {
    setSession(null);
    setUser(null);
    setProfile(null);
    if (expired) setSessionExpired(true);
    await supabase.auth.signOut();
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { user: validatedUser }, error } = await supabase.auth.getUser();

      if (error && isJwtExpiredError(error)) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!mounted) return;

        if (refreshError || !refreshData.session) {
          await handleSessionLoss(true);
          return;
        }

        const refreshed = refreshData.session;
        setSession(refreshed);
        setUser(refreshed.user);
        setSessionExpired(false);
        setTimeout(() => { void fetchProfile(refreshed.user.id); }, 0);
        setLoading(false);
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(currentSession);
      setUser(validatedUser ?? currentSession?.user ?? null);
      setSessionExpired(false);
      if (validatedUser ?? currentSession?.user) {
        setTimeout(() => { void fetchProfile((validatedUser ?? currentSession!.user).id); }, 0);
      }
      setLoading(false);
    };

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          setSessionExpired(false);
          setTimeout(() => { void fetchProfile(nextSession.user.id); }, 0);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
        }

        if (event === "TOKEN_REFRESHED") {
          setSessionExpired(false);
        }

        setLoading(false);
      }
    );

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void ensureValidSession();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchProfile, handleSessionLoss]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setSessionExpired(false);
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (!error && data.user) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
      setPushEnabledPreference(true);
      void autoEnablePushNotifications(data.user.id);
      setSessionExpired(false);
    }
    return { error: error as Error | null, user: data.user ?? null };
  };

  const signOut = async () => {
    setSessionExpired(false);
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        sessionExpired,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
