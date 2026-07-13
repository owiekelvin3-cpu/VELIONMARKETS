import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { completePushSetup } from "@/lib/push-notifications";
import { prepareNotificationsOnUserGesture } from "@/lib/notification-preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { Logo } from "@/components/brand/Logo";
import { IMAGES } from "@/constants/images";
import { Mail, X } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export default function AuthPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: Mode = searchParams.get("mode") === "register" ? "register" : "login";
  const { signIn, signUp, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired =
    (location.state as { sessionExpired?: boolean } | null)?.sessionExpired === true;
  const [error, setError] = useState(sessionExpired ? t("auth.sessionExpired") : "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionExpired) clearSessionExpired();
  }, [sessionExpired, clearSessionExpired]);

  function setMode(next: Mode) {
    setError("");
    setSearchParams(next === "register" ? { mode: "register" } : {}, { replace: true });
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const permissionPromise = prepareNotificationsOnUserGesture();
    const form = new FormData(e.currentTarget);
    const { error } = await signIn(form.get("email") as string, form.get("password") as string);
    if (error) {
      setError(error.message);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          await completePushSetup(user.id, permissionPromise);
        } catch {
          /* ignore */
        }
      }
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const permissionPromise = prepareNotificationsOnUserGesture();
    const form = new FormData(e.currentTarget);
    const { error, user } = await signUp(
      form.get("email") as string,
      form.get("password") as string,
      form.get("fullName") as string
    );
    if (error) {
      setError(error.message);
    } else {
      if (user) await completePushSetup(user.id, permissionPromise);
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const fieldClass =
    "h-12 rounded-xl border-border bg-secondary/40 text-foreground placeholder:text-muted focus-visible:border-emerald/50 focus-visible:ring-emerald/20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-3 py-6 sm:px-6 sm:py-10">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex w-full max-w-[980px] overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5"
      >
        <AuthBrandPanel />

        <div className="relative flex w-full flex-col bg-card text-foreground lg:w-1/2">
          {/* Mobile cinematic strip — image stays dark for contrast */}
          <div className="relative h-36 overflow-hidden lg:hidden">
            <img src={IMAGES.auth.panel} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/30" />
            <p className="relative z-10 flex h-full items-end justify-center px-6 pb-4 text-center font-display text-xl font-bold leading-tight text-white">
              {t("auth.sloganLine1")} {t("auth.sloganLine2")}
            </p>
          </div>

          <div className="flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
            <Logo size="md" />
            <Link
              to="/"
              aria-label={t("common.close")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 sm:py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mx-auto w-full max-w-[340px]"
              >
                <h1 className="mb-8 text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                  {mode === "login" ? t("auth.signInTitle") : t("auth.signUpTitle")}
                </h1>

                {mode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={t("common.email")}
                        className={cn(fieldClass, "pl-10")}
                      />
                    </div>
                    <PasswordInput
                      id="login-password"
                      name="password"
                      required
                      minLength={6}
                      autoComplete="current-password"
                      placeholder={t("common.password")}
                      className={fieldClass}
                    />
                    {error ? <p className="text-sm text-red-500">{error}</p> : null}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="mt-2 h-12 w-full rounded-xl text-base"
                    >
                      {loading ? t("auth.signingIn") : t("auth.signInTitle")}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input
                      id="reg-name"
                      name="fullName"
                      required
                      autoComplete="name"
                      placeholder={t("common.fullName")}
                      className={fieldClass}
                    />
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={t("common.email")}
                        className={cn(fieldClass, "pl-10")}
                      />
                    </div>
                    <PasswordInput
                      id="reg-password"
                      name="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder={t("common.password")}
                      className={fieldClass}
                    />
                    {error ? <p className="text-sm text-red-500">{error}</p> : null}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="mt-2 h-12 w-full rounded-xl text-base"
                    >
                      {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                    </Button>
                  </form>
                )}

                <p className="mt-5 text-center text-xs text-muted">{t("auth.emailOnlyNote")}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-t border-border px-6 py-5 text-center sm:px-8">
            {mode === "login" ? (
              <p className="text-sm text-muted">
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-emerald hover:underline"
                >
                  {t("auth.signUpLink")}
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted">
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-emerald hover:underline"
                >
                  {t("auth.signInLink")}
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
