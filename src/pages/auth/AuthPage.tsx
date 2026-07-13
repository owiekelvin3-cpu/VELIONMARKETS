import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { completePushSetup } from "@/lib/push-notifications";
import { prepareNotificationsOnUserGesture } from "@/lib/notification-preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { AuthBrandPanel, AuthFormHeader } from "@/components/auth/AuthBrandPanel";
import { Shield } from "@/lib/icons";

export default function AuthPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("mode") === "register" ? "register" : "login";
  const { signIn, signUp, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired =
    (location.state as { sessionExpired?: boolean } | null)?.sessionExpired === true;
  const [error, setError] = useState(sessionExpired ? t("auth.sessionExpired") : "");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (sessionExpired) clearSessionExpired();
  }, [sessionExpired, clearSessionExpired]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await completePushSetup(user.id, permissionPromise);
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

  return (
    <div className="flex min-h-screen bg-void">
      <AuthBrandPanel />

      <div className="relative flex flex-1 flex-col">
        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <LanguageSelector />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8 lg:px-12 xl:px-16">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <AuthFormHeader />

            <Tabs defaultValue={defaultTab}>
              <TabsList className="mb-8 grid h-11 w-full grid-cols-2 rounded-xl bg-secondary/70 p-1">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-emerald/15 data-[state=active]:text-emerald">
                  {t("auth.login")}
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-emerald/15 data-[state=active]:text-emerald">
                  {t("auth.register")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="login-email">{t("common.email")}</Label>
                    <Input id="login-email" name="email" type="email" required className="mt-2 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="login-password">{t("common.password")}</Label>
                    <Input id="login-password" name="password" type="password" required minLength={6} className="mt-2 h-11" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex cursor-pointer items-center gap-2 text-muted">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="rounded border-border bg-secondary text-emerald focus:ring-emerald/40"
                      />
                      {t("auth.rememberMe")}
                    </label>
                    <span className="text-emerald/80">{t("auth.forgotPassword")}</span>
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={loading}>
                    {loading ? t("auth.signingIn") : t("auth.signInSecurely")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <Label htmlFor="reg-name">{t("common.fullName")}</Label>
                    <Input id="reg-name" name="fullName" required className="mt-2 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">{t("common.email")}</Label>
                    <Input id="reg-email" name="email" type="email" required className="mt-2 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="reg-password">{t("common.password")}</Label>
                    <Input id="reg-password" name="password" type="password" required minLength={6} className="mt-2 h-11" />
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={loading}>
                    {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
              <Shield className="h-3.5 w-3.5 text-emerald" aria-hidden="true" />
              {t("auth.securityNote")}
            </div>

            <p className="mt-6 text-center text-sm text-muted lg:hidden">
              <Link to="/" className="text-emerald hover:underline">{t("common.backHome")}</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
