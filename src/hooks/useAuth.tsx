import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureValidSession, isJwtExpiredError, onSessionExpired } from "@/lib/auth-session";
import { syncUserLocation } from "@/lib/user-location";
import type { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileStatus: "idle" | "loading" | "ready" | "error";
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    location?: { country: string; region: string }
  ) => Promise<{ error: Error | null; user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<Profile | null>;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [sessionExpired, setSessionExpired] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileStatus("loading");

    const withTimeout = <T,>(promise: PromiseLike<T>, ms = 12_000) =>
      Promise.race([
        Promise.resolve(promise),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Profile load timed out")), ms);
        }),
      ]);

    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single()
      );

      if (error && isJwtExpiredError(error)) {
        const ok = await ensureValidSession();
        if (ok) {
          const retry = await withTimeout(
            supabase.from("profiles").select("*").eq("id", userId).single()
          );
          if (retry.data) {
            setProfile(retry.data);
            setProfileStatus("ready");
            return retry.data;
          }
          setProfile(null);
          setProfileStatus("error");
          return null;
        }
        setSessionExpired(true);
        setProfileStatus("error");
        await supabase.auth.signOut();
        return null;
      }

      if (error) {
        console.error("Failed to load profile", error);
        setProfile(null);
        setProfileStatus("error");
        return null;
      }

      setProfile(data);
      setProfileStatus("ready");
      void syncUserLocation(userId);
      return data;
    } catch (err) {
      console.error("Failed to load profile", err);
      setProfile(null);
      setProfileStatus("error");
      return null;
    }
  }, []);

  const refreshProfile = async (userId?: string) => {
    const id = userId ?? user?.id;
    if (!id) return null;
    return fetchProfile(id);
  };

  const clearSessionExpired = () => setSessionExpired(false);

  const handleSessionLoss = useCallback(async (expired = true) => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileStatus("idle");
    if (expired) setSessionExpired(true);
    await supabase.auth.signOut();
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { user: validatedUser }, error } = await supabase.auth.getUser();

      if (error) {
        // Includes "exp claim timestamp check failed" and other stale-token shapes.
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!mounted) return;

        if (refreshError || !refreshData.session) {
          // Only force sign-out when the token is clearly expired / unusable.
          if (isJwtExpiredError(error) || isJwtExpiredError(refreshError)) {
            await handleSessionLoss(true);
            return;
          }
        } else {
          const refreshed = refreshData.session;
          setSession(refreshed);
          setUser(refreshed.user);
          setSessionExpired(false);
          setTimeout(() => { void fetchProfile(refreshed.user.id); }, 0);
          setLoading(false);
          return;
        }
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
          setProfileStatus("idle");
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
    const removeSessionListener = onSessionExpired(() => {
      void handleSessionLoss(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      removeSessionListener();
    };
  }, [fetchProfile, handleSessionLoss]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // Sync React state immediately — onAuthStateChange can lag one tick and
    // route guards would otherwise see user=null and bounce back to login.
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
      setSessionExpired(false);
      await fetchProfile(data.session.user.id);
    }
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    location?: { country: string; region: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          country: location?.country,
          region: location?.region,
        },
      },
    });
    if (!error && data.user) {
      await supabase.from("profiles").update({
        full_name: fullName,
        country: location?.country || null,
        region: location?.region || null,
      }).eq("id", data.user.id);
      setSessionExpired(false);
      // Same race fix as signIn — sync React state before navigating.
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchProfile(data.session.user.id);
      }
    }
    return {
      error: error as Error | null,
      user: data.user ?? null,
      session: data.session ?? null,
    };
  };

  const signOut = async () => {
    setSessionExpired(false);
    await supabase.auth.signOut();
    setProfile(null);
    setProfileStatus("idle");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileStatus,
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
