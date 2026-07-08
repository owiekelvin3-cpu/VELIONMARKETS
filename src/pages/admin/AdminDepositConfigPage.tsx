import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coins, ExternalLink, Gift, Plus, Trash2 } from "@/lib/icons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";
import {
  getDefaultDepositConfig,
  saveDepositConfig,
  type DepositPlatformConfig,
} from "@/lib/deposit-config";
import { useDepositConfig, useInvalidateDepositConfig } from "@/hooks/useDepositConfig";
import type { PurchasePartner } from "@/constants/purchase-partners";

function newPartnerId() {
  return `partner_${Date.now().toString(36)}`;
}

function emptyPartner(): PurchasePartner {
  return {
    id: newPartnerId(),
    name: "",
    description: "",
    url: "https://",
    color: "#2563EB",
    enabled: true,
  };
}

function PartnerEditor({
  partner,
  onChange,
  onRemove,
}: {
  partner: PurchasePartner;
  onChange: (next: PurchasePartner) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: partner.color || "#2563EB" }}
          >
            {partner.logoUrl ? (
              <img src={partner.logoUrl} alt="" className="h-6 w-6 object-contain" />
            ) : (
              (partner.name || "??").slice(0, 2).toUpperCase()
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={partner.enabled !== false}
              onChange={(e) => onChange({ ...partner, enabled: e.target.checked })}
              className="rounded border-white/20"
            />
            {t("admin.partnerEnabled")}
          </label>
        </div>
        <Button type="button" variant="outline" size="sm" className="border-red-500/20 text-red-400" onClick={onRemove}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {t("admin.removePartner")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("admin.partnerName")}</Label>
          <Input
            value={partner.name}
            onChange={(e) => onChange({ ...partner, name: e.target.value })}
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label>{t("admin.partnerUrl")}</Label>
          <Input
            type="url"
            value={partner.url}
            onChange={(e) => onChange({ ...partner, url: e.target.value })}
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label>{t("admin.partnerColor")}</Label>
          <div className="mt-2 flex gap-2">
            <Input
              type="color"
              value={partner.color}
              onChange={(e) => onChange({ ...partner, color: e.target.value })}
              className="h-11 w-14 cursor-pointer p-1"
            />
            <Input
              value={partner.color}
              onChange={(e) => onChange({ ...partner, color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label>{t("admin.partnerLogoUrl")}</Label>
          <Input
            value={partner.logoUrl ?? ""}
            onChange={(e) => onChange({ ...partner, logoUrl: e.target.value || undefined })}
            placeholder="https://"
            className="mt-2"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>{t("admin.partnerDescription")}</Label>
          <Input
            value={partner.description ?? ""}
            onChange={(e) => onChange({ ...partner, description: e.target.value })}
            className="mt-2"
          />
        </div>
        <div>
          <Label>{t("admin.partnerTag")}</Label>
          <Input
            value={partner.tag ?? ""}
            onChange={(e) => onChange({ ...partner, tag: e.target.value || undefined })}
            placeholder={t("admin.partnerTagPlaceholder")}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminDepositConfigPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useDepositConfig();
  const invalidate = useInvalidateDepositConfig();
  const [config, setConfig] = useState<DepositPlatformConfig>(getDefaultDepositConfig());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const updateWallet = (assetId: string, address: string) => {
    setConfig((prev) => ({
      ...prev,
      cryptoWallets: { ...prev.cryptoWallets, [assetId]: address },
    }));
  };

  const updatePartners = (
    key: "cryptoPartners" | "giftCardPartners",
    updater: (partners: PurchasePartner[]) => PurchasePartner[]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: updater(prev[key]) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveDepositConfig(config);
      await invalidate();
      setSuccess(t("admin.depositConfigSaved"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setSaving(false);
  };

  if (isLoading && !data) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.depositConfigTitle")}
        subtitle={t("admin.depositConfigSubtitle")}
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("admin.saving") : t("admin.saveChanges")}
          </Button>
        }
      />

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>}
      {success && <p className="rounded-lg border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-emerald">{success}</p>}

      <Tabs defaultValue="wallets" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3 bg-white/[0.03]">
          <TabsTrigger value="wallets" className="gap-2">
            <Coins className="h-4 w-4" />
            {t("admin.cryptoWallets")}
          </TabsTrigger>
          <TabsTrigger value="crypto-sites" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {t("admin.buyCryptoSites")}
          </TabsTrigger>
          <TabsTrigger value="gift-sites" className="gap-2">
            <Gift className="h-4 w-4" />
            {t("admin.buyGiftCardSites")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <AdminPanel title={t("admin.cryptoWallets")} description={t("admin.cryptoWalletsDesc")}>
            <div className="space-y-4">
              {CRYPTO_ASSETS.map((asset) => (
                <div key={asset.id} className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3">
                    <img src={asset.iconUrl} alt="" className="h-8 w-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{asset.label}</p>
                      <p className="text-xs text-muted">{asset.symbol}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="sr-only">{t("admin.walletAddress", { asset: asset.label })}</Label>
                    <Input
                      value={config.cryptoWallets[asset.id] ?? ""}
                      onChange={(e) => updateWallet(asset.id, e.target.value)}
                      placeholder={t("admin.walletAddressPlaceholder")}
                      className="font-mono text-xs sm:text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="crypto-sites">
          <AdminPanel
            title={t("admin.buyCryptoSites")}
            description={t("admin.buyCryptoSitesDesc")}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10"
                onClick={() => updatePartners("cryptoPartners", (p) => [...p, emptyPartner()])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("admin.addPartner")}
              </Button>
            }
          >
            <div className="space-y-4">
              {config.cryptoPartners.map((partner, index) => (
                <PartnerEditor
                  key={partner.id}
                  partner={partner}
                  onChange={(next) =>
                    updatePartners("cryptoPartners", (partners) =>
                      partners.map((p, i) => (i === index ? next : p))
                    )
                  }
                  onRemove={() =>
                    updatePartners("cryptoPartners", (partners) => partners.filter((_, i) => i !== index))
                  }
                />
              ))}
              {config.cryptoPartners.length === 0 && (
                <p className="text-sm text-muted">{t("admin.noPartners")}</p>
              )}
            </div>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="gift-sites">
          <AdminPanel
            title={t("admin.buyGiftCardSites")}
            description={t("admin.buyGiftCardSitesDesc")}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10"
                onClick={() => updatePartners("giftCardPartners", (p) => [...p, emptyPartner()])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("admin.addPartner")}
              </Button>
            }
          >
            <div className="space-y-4">
              {config.giftCardPartners.map((partner, index) => (
                <PartnerEditor
                  key={partner.id}
                  partner={partner}
                  onChange={(next) =>
                    updatePartners("giftCardPartners", (partners) =>
                      partners.map((p, i) => (i === index ? next : p))
                    )
                  }
                  onRemove={() =>
                    updatePartners("giftCardPartners", (partners) => partners.filter((_, i) => i !== index))
                  }
                />
              ))}
              {config.giftCardPartners.length === 0 && (
                <p className="text-sm text-muted">{t("admin.noPartners")}</p>
              )}
            </div>
          </AdminPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
