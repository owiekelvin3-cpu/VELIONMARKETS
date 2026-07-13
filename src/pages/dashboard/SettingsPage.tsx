import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  getNotificationSoundEnabled,
  primeNotificationSound,
  setNotificationSoundEnabled,
} from "@/lib/notification-sound";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeSelector } from "@/components/layout/ThemeToggle";
import { supabase } from "@/lib/supabase";
import {
  uploadAvatar,
  removeAvatar,
  updateProfileFields,
  connectBrowserWallet,
} from "@/lib/profile-settings";
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
  Wallet,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

type Section = "profile" | "wallet" | "security" | "notifications" | "preferences";

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

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t("settingsPage.title")} subtitle={t("settingsPage.subtitle")} />

      {(message || error) && (
        <div
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-sm",
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald/30 bg-emerald/10 text-emerald"
          )}
        >
          {error || message}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                section === s.id
                  ? "bg-emerald/10 text-emerald"
                  : "text-muted hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {t(s.labelKey)}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {section === "profile" && (
            <Card className="border-border bg-secondary/50">
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
                        {profile?.kyc_status ?? "none"}
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
                    className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-emerald/30 focus:outline-none focus:ring-1 focus:ring-emerald/20"
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
            <Card className="border-border bg-secondary/50">
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
            <Card className="border-border bg-secondary/50">
              <CardHeader>
                <CardTitle>{t("settingsPage.securityTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.securityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("settingsPage.newPassword")}</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="newPassword"
                        type="password"
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
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="confirmPassword"
                        type="password"
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
            <Card className="border-border bg-secondary/50">
              <CardHeader>
                <CardTitle>{t("settingsPage.notificationsTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.notificationsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
                  <div>
                    <p className="text-sm font-medium">{t("settingsPage.pushNotifications")}</p>
                    <p className="text-xs text-muted">{t("settingsPage.pushNotificationsDesc")}</p>
                    {push.permission === "denied" && (
                      <p className="mt-1 text-xs text-amber-400">{t("notifications.pushBlocked")}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={push.enabled}
                    disabled={!push.supported || push.busy || push.permission === "denied"}
                    onClick={() => {
                      primeNotificationSound();
                      void push.toggle();
                    }}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                      push.enabled ? "bg-emerald" : "bg-white/15",
                      (!push.supported || push.permission === "denied") && "opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                        push.enabled ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                  <div>
                    <p className="text-sm font-medium">{t("settingsPage.notificationSound")}</p>
                    <p className="text-xs text-muted">{t("settingsPage.notificationSoundDesc")}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={soundEnabled}
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      setNotificationSoundEnabled(next);
                      if (next) primeNotificationSound();
                    }}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      soundEnabled ? "bg-emerald" : "bg-white/15"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        soundEnabled ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                {!push.supported && (
                  <p className="text-xs text-muted">{t("settingsPage.pushUnsupported")}</p>
                )}
              </CardContent>
            </Card>
          )}

          {section === "preferences" && (
            <Card className="border-border bg-secondary/50">
              <CardHeader>
                <CardTitle>{t("settingsPage.preferencesTitle")}</CardTitle>
                <CardDescription>{t("settingsPage.preferencesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
