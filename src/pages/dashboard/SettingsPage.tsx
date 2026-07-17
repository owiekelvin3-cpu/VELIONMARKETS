import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  getNotificationSoundEnabled,
  playNotificationSound,
  setNotificationSoundEnabled,
  unlockNotificationAudio,
} from "@/lib/notification-sound";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeSelector } from "@/components/layout/ThemeToggle";
import { CurrencySelector } from "@/components/settings/CurrencySelector";
import { supabase } from "@/lib/supabase";
import {
  uploadAvatar,
  removeAvatar,
  updateProfileFields,
  updateUserCurrency,
  connectBrowserWallet,
} from "@/lib/profile-settings";
import { setActiveCurrency } from "@/lib/currency";
import { DEFAULT_CURRENCY } from "@/constants/currencies";
import {
  Bell,
  Check,
  Copy,
  FileCheck,
  Key,
  Lock,
  Mail,
  Settings,
  Trash2,
  Volume2,
  Wallet,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

type Section = "profile" | "wallet" | "security" | "notifications" | "preferences";

function PrefSwitch({
  checked,
  disabled,
  busy,
  onLabel,
  offLabel,
  onToggle,
  name,
}: {
  checked: boolean;
  disabled?: boolean;
  busy?: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: (next: boolean) => void;
  name: string;
}) {
  const locked = Boolean(disabled || busy);

  return (
    <div
      className={cn(
        "grid w-full max-w-[11.5rem] shrink-0 grid-cols-2 gap-1 rounded-xl border border-border bg-secondary/40 p-1",
        locked && "opacity-60"
      )}
      role="group"
      aria-label={name}
    >
      <button
        type="button"
        disabled={locked}
        aria-pressed={!checked}
        onClick={() => {
          if (!checked) return;
          onToggle(false);
        }}
        className={cn(
          "min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors",
          !checked
            ? "bg-card text-foreground shadow-sm ring-1 ring-border"
            : "text-muted hover:text-foreground"
        )}
      >
        {offLabel}
      </button>
      <button
        type="button"
        disabled={locked}
        aria-pressed={checked}
        onClick={() => {
          if (checked) return;
          onToggle(true);
        }}
        className={cn(
          "min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors",
          checked
            ? "bg-emerald text-white shadow-sm"
            : "text-muted hover:text-foreground"
        )}
      >
        {busy ? "…" : onLabel}
      </button>
    </div>
  );
}

const sections: { id: Section; labelKey: string; icon: typeof Settings }[] = [
  { id: "profile", labelKey: "settingsPage.sections.profile", icon: Settings },
  { id: "wallet", labelKey: "settingsPage.sections.wallet", icon: Wallet },
  { id: "security", labelKey: "settingsPage.sections.security", icon: Lock },
  { id: "notifications", labelKey: "settingsPage.sections.notifications", icon: Bell },
  { id: "preferences", labelKey: "settingsPage.sections.preferences", icon: Settings },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const push = usePushNotifications(user?.id);
  const [soundEnabled, setSoundEnabled] = useState(() => getNotificationSoundEnabled());

  const [section, setSection] = useState<Section>("profile");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletLabel, setWalletLabel] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [currencyBusy, setCurrencyBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setBio(profile.bio ?? "");
    setWalletAddress(profile.wallet_address ?? "");
    setWalletLabel(profile.wallet_label ?? "");
  }, [profile]);

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage("");
    } else {
      setMessage(msg);
      setError("");
    }
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 4000);
  };

  const handleCurrencyChange = async (code: string) => {
    if (!user) return;
    setCurrencyBusy(true);
    try {
      await updateUserCurrency(user.id, code);
      setActiveCurrency(code);
      await refreshProfile(user.id);
      flash(t("settingsPage.currencyUpdated"));
    } catch {
      flash(t("settingsPage.saveFailed"), true);
    } finally {
      setCurrencyBusy(false);
    }
  };

  const handleAvatarPick = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(user.id, file);
      await refreshProfile();
      flash(t("settingsPage.avatarUpdated"));
    } catch (e) {
      flash(e instanceof Error ? e.message : t("settingsPage.saveFailed"), true);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      await removeAvatar(user.id);
      await refreshProfile();
      flash(t("settingsPage.avatarRemoved"));
    } catch (e) {
      flash(e instanceof Error ? e.message : t("settingsPage.saveFailed"), true);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfileFields(user.id, {
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      });
      await refreshProfile();
      flash(t("settingsPage.profileSaved"));
    } catch (e) {
      flash(e instanceof Error ? e.message : t("settingsPage.saveFailed"), true);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    try {
      const result = await connectBrowserWallet();
      if (!result) {
        flash(t("settingsPage.walletNotFound"), true);
        return;
      }
      setWalletAddress(result.address);
      setWalletLabel(result.label);
      if (user) {
        await updateProfileFields(user.id, {
          wallet_address: result.address,
          wallet_label: result.label,
        });
        await refreshProfile();
      }
      flash(t("settingsPage.walletConnected"));
    } catch (e) {
      flash(e instanceof Error ? e.message : t("settingsPage.walletConnectFailed"), true);
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfileFields(user.id, {
        wallet_address: walletAddress.trim() || null,
        wallet_label: walletLabel.trim() || (walletAddress.trim() ? "Manual" : null),
      });
      await refreshProfile();
      flash(t("settingsPage.walletSaved"));
    } catch (e) {
      flash(e instanceof Error ? e.message : t("settingsPage.saveFailed"), true);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectWallet = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfileFields(user.id, { wallet_address: null, wallet_label: null });
      setWalletAddress("");
      setWalletLabel("");
      await refreshProfile();
      flash(t("settingsPage.walletDisconnected"));
    } catch (e) {
      flash(e instanceof Error ? e.message : t("settingsPage.saveFailed"), true);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      flash(t("settingsPage.passwordTooShort"), true);
      return;
    }
    if (newPassword !== confirmPassword) {
      flash(t("settingsPage.passwordMismatch"), true);
      return;
    }
    setSaving(true);
    try {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) throw pwError;
      setNewPassword("");
      setConfirmPassword("");
      flash(t("settingsPage.passwordUpdated"));
    } catch (e) {
      flash(e instanceof Error ? e.message : t("settingsPage.saveFailed"), true);
    } finally {
      setSaving(false);
    }
  };

  const copyWallet = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const kycBadge: Record<string, "default" | "success" | "warning" | "destructive"> = {
    none: "secondary" as "default",
    pending: "warning",
    approved: "success",
    rejected: "destructive",
  };
  const kycLabels: Record<string, string> = {
    none: "dashboard.kycNone",
    pending: "dashboard.kycPending",
    approved: "dashboard.verified",
    rejected: "dashboard.kycRejected",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow={t("dashboard.navGroupAccount")}
        title={t("settingsPage.title")}
        subtitle={t("settingsPage.subtitle")}
      />

      {(message || error) && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald/30 bg-emerald/10 text-emerald"
          )}
        >
          {error || message}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-border bg-secondary/30 p-1 lg:w-52 lg:flex-col lg:overflow-visible">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                section === s.id
                  ? "nav-item-active"
                  : "text-muted hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {t(s.labelKey)}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {section === "profile" && (
            <Card className="dashboard-stat !p-0 border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>{t("settingsPage.profileTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.profileDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <UserAvatar
                    size="lg"
                    name={profile?.full_name}
                    avatarUrl={profile?.avatar_url}
                    editable
                    uploading={uploadingAvatar}
                    onPick={handleAvatarPick}
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-muted">{t("settingsPage.avatarHint")}</p>
                    {profile?.avatar_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-border"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        {t("settingsPage.removeAvatar")}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("settingsPage.fullName")}</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-border bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("settingsPage.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="email"
                        value={profile?.email ?? ""}
                        disabled
                        className="border-border bg-secondary/50 pl-10 opacity-70"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("settingsPage.phone")}</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="border-border bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settingsPage.kycStatus")}</Label>
                    <div className="flex h-10 items-center gap-2">
                      <Badge variant={kycBadge[profile?.kyc_status ?? "none"]}>
                        {t(kycLabels[profile?.kyc_status ?? "none"] ?? "dashboard.kycNone")}
                      </Badge>
                      {profile?.kyc_status !== "approved" && (
                        <Link to="/dashboard/kyc" className="text-xs text-emerald hover:underline">
                          {t("settingsPage.completeKyc")}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t("settingsPage.bio")}</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder={t("settingsPage.bioPlaceholder")}
                    className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-base text-foreground placeholder:text-muted focus:border-emerald/30 focus:outline-none focus:ring-1 focus:ring-emerald/20"
                  />
                </div>

                {profile?.created_at && (
                  <p className="text-xs text-muted">
                    {t("settingsPage.memberSince", {
                      date: new Date(profile.created_at).toLocaleDateString(),
                    })}
                  </p>
                )}

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? t("common.saving") : t("settingsPage.saveProfile")}
                </Button>
              </CardContent>
            </Card>
          )}

          {section === "wallet" && (
            <Card className="dashboard-stat !p-0 border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>{t("settingsPage.walletTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.walletDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={connectingWallet}
                  className="w-full sm:w-auto"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {connectingWallet ? t("settingsPage.connecting") : t("settingsPage.connectWallet")}
                </Button>
                <p className="text-xs text-muted">{t("settingsPage.walletBrowserHint")}</p>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted">{t("settingsPage.orManual")}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletLabel">{t("settingsPage.walletLabel")}</Label>
                  <Input
                    id="walletLabel"
                    value={walletLabel}
                    onChange={(e) => setWalletLabel(e.target.value)}
                    placeholder="MetaMask, Trust Wallet…"
                    className="border-border bg-secondary/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">{t("settingsPage.walletAddress")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="walletAddress"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x…"
                      className="border-border bg-secondary/60 font-mono text-xs"
                    />
                    {walletAddress && (
                      <Button type="button" variant="outline" size="icon" className="shrink-0 border-border" onClick={copyWallet}>
                        {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveWallet} disabled={saving}>
                    {saving ? t("common.saving") : t("settingsPage.saveWallet")}
                  </Button>
                  {profile?.wallet_address && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border"
                      onClick={handleDisconnectWallet}
                      disabled={saving}
                    >
                      {t("settingsPage.disconnectWallet")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {section === "security" && (
            <Card className="dashboard-stat !p-0 border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>{t("settingsPage.securityTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.securityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("settingsPage.newPassword")}</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                      <PasswordInput
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        className="border-border bg-secondary/60 pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("settingsPage.confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                      <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        className="border-border bg-secondary/60 pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={saving || !newPassword}>
                    {saving ? t("common.saving") : t("settingsPage.updatePassword")}
                  </Button>
                </form>

                <div className="mt-8 rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-start gap-3">
                    <FileCheck className="mt-0.5 h-5 w-5 text-emerald" />
                    <div>
                      <p className="text-sm font-medium">{t("settingsPage.identityTitle")}</p>
                      <p className="mt-1 text-xs text-muted">{t("settingsPage.identityDesc")}</p>
                      <Link to="/kyc" className="mt-2 inline-block text-xs text-emerald hover:underline">
                        {t("settingsPage.goToKyc")}
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {section === "notifications" && (
            <Card className="dashboard-stat !p-0 border-border/70 bg-card/80">
              <CardHeader className="space-y-1.5 border-b border-border/60">
                <CardTitle>{t("settingsPage.notificationsTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.notificationsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3",
                    push.permission === "denied"
                      ? "border-amber-500/25 bg-amber-500/[0.06]"
                      : push.enabled
                        ? "border-emerald/25 bg-emerald/[0.06]"
                        : "border-border bg-secondary/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      push.enabled
                        ? "bg-emerald/15 text-emerald"
                        : push.permission === "denied"
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-secondary text-muted"
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {!push.supported
                        ? t("settingsPage.pushStatusUnsupported")
                        : push.permission === "denied"
                          ? t("settingsPage.pushStatusBlocked")
                          : push.enabled
                            ? t("settingsPage.pushStatusOn")
                            : push.permission === "default"
                              ? t("settingsPage.pushStatusDefault")
                              : t("settingsPage.pushStatusOff")}
                    </p>
                    <p className="text-xs text-muted">
                      {push.permission === "denied"
                        ? t("settingsPage.pushBlockedHelp")
                        : !push.supported
                          ? t("settingsPage.pushUnsupported")
                          : t("settingsPage.pushNotificationsDesc")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      push.enabled
                        ? "border-emerald/30 bg-emerald/10 text-emerald"
                        : push.permission === "denied"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-border bg-secondary/60 text-muted"
                    )}
                  >
                    {push.enabled
                      ? t("settingsPage.pushStatusOn")
                      : push.permission === "denied"
                        ? t("settingsPage.pushStatusBlocked")
                        : t("settingsPage.pushStatusOff")}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/80">
                  <div className="flex flex-col gap-4 border-b border-border/70 bg-secondary/20 px-4 py-4 sm:flex-row sm:items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald/30 bg-emerald text-black shadow-sm">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {t("settingsPage.pushNotifications")}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {t("settingsPage.pushNotificationsDesc")}
                      </p>
                      {push.permission === "denied" && (
                        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                          {t("notifications.pushBlocked")}
                        </p>
                      )}
                    </div>
                    <PrefSwitch
                      name={t("settingsPage.pushNotifications")}
                      checked={push.enabled}
                      disabled={!push.supported || push.permission === "denied" || !user}
                      busy={push.busy}
                      onLabel={t("settingsPage.prefOn")}
                      offLabel={t("settingsPage.prefOff")}
                      onToggle={(next) => {
                        unlockNotificationAudio();
                        if (next === push.enabled) return;
                        void push.toggle();
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground">
                      <Volume2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {t("settingsPage.notificationSound")}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {t("settingsPage.notificationSoundDesc")}
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                      <PrefSwitch
                        name={t("settingsPage.notificationSound")}
                        checked={soundEnabled}
                        onLabel={t("settingsPage.prefOn")}
                        offLabel={t("settingsPage.prefOff")}
                        onToggle={(next) => {
                          setSoundEnabled(next);
                          setNotificationSoundEnabled(next);
                          if (next) {
                            unlockNotificationAudio();
                            void playNotificationSound();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={!soundEnabled}
                        onClick={() => {
                          unlockNotificationAudio();
                          void playNotificationSound();
                        }}
                      >
                        {t("settingsPage.testSound")}
                      </Button>
                    </div>
                  </div>
                </div>

                {!push.supported && (
                  <p className="rounded-xl border border-border/70 bg-secondary/20 px-3 py-2.5 text-xs text-muted">
                    {t("settingsPage.pushUnsupported")}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/15 px-4 py-3">
                  <p className="text-xs text-muted">{t("settingsPage.notifInboxHint")}</p>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to="/dashboard/notifications">{t("settingsPage.openNotifications")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {section === "preferences" && (
            <Card className="dashboard-stat !p-0 border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>{t("settingsPage.preferencesTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.preferencesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                  <div>
                    <p className="text-sm font-medium">{t("settingsPage.currency")}</p>
                    <p className="text-xs text-muted">{t("settingsPage.currencyDesc")}</p>
                  </div>
                  <CurrencySelector
                    value={profile?.preferred_currency ?? DEFAULT_CURRENCY}
                    onChange={handleCurrencyChange}
                    busy={currencyBusy}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                  <div>
                    <p className="text-sm font-medium">{t("settingsPage.language")}</p>
                    <p className="text-xs text-muted">{t("settingsPage.languageDesc")}</p>
                  </div>
                  <LanguageSelector />
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="mb-3">
                    <p className="text-sm font-medium">{t("settingsPage.theme")}</p>
                    <p className="text-xs text-muted">{t("settingsPage.themeDesc")}</p>
                  </div>
                  <ThemeSelector />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
