import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { BrandLogo } from "@/components/dashboard/DepositIcons";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { FadeIn } from "@/components/motion/Motion";
import { GIFT_CARD_BRANDS } from "@/constants/deposit-assets";
import { cn } from "@/lib/utils";

async function uploadGiftCardImage(userId: string, file: File, side: "front" | "back") {
  const path = `${userId}/gift-cards/${Date.now()}-${side}-${file.name}`;
  const { error } = await supabase.storage.from("kyc-documents").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("kyc-documents").getPublicUrl(path);
  return data.publicUrl;
}

export default function GiftCardBrandDepositPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const brand = GIFT_CARD_BRANDS.find((g) => g.id === brandId);

  const [amount, setAmount] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  if (!brand) {
    return <Navigate to="/dashboard/deposits/gift-card" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !frontImage) return;

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const [frontUrl, backUrl] = await Promise.all([
        uploadGiftCardImage(user.id, frontImage, "front"),
        backImage ? uploadGiftCardImage(user.id, backImage, "back") : Promise.resolve(null),
      ]);

      const depositNotes = JSON.stringify({
        cardCode,
        additionalNotes: notes || null,
        frontImageUrl: frontUrl,
        backImageUrl: backUrl,
      });

      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: parseFloat(amount),
        method: `gift_card_${brand.id}`,
        status: "pending",
        notes: depositNotes,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setSuccess(true);
        setMessage(t("deposits.submitSuccess"));
        setAmount("");
        setCardCode("");
        setFrontImage(null);
        setBackImage(null);
        setNotes("");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("deposits.submitError"));
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <DepositPageHeader
        title={t("deposits.title")}
        subtitle={t("deposits.subtitle")}
        backTo="/dashboard/deposits"
      />

      <FadeIn>
        <div className="rounded-2xl border border-border bg-secondary/50 p-5 sm:p-6">
          <Link
            to="/dashboard/deposits/gift-card"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("deposits.backToBrands")}
          </Link>

          <div className="mb-6 flex items-center gap-4">
            <BrandLogo src={brand.iconUrl} alt={brand.label} size="xl" tileClassName="rounded-2xl" />
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">{brand.fullName}</h2>
              <p className="text-sm text-muted">{t("deposits.giftCardFormDesc")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount" className="text-sm text-foreground">
                  {t("deposits.cardValueLabel")}
                  <span className="text-red-400"> *</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  required
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="cardCode" className="text-sm text-foreground">
                  {t("deposits.cardCodeLabel")}
                  <span className="text-red-400"> *</span>
                </Label>
                <Input
                  id="cardCode"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  required
                  className="mt-2 h-11 font-mono tracking-wider"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploadField
                id="frontImage"
                label={t("deposits.frontImage")}
                required
                value={frontImage}
                onChange={setFrontImage}
              />
              <ImageUploadField
                id="backImage"
                label={t("deposits.backImage")}
                value={backImage}
                onChange={setBackImage}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm text-foreground">
                {t("deposits.additionalNotes")}
              </Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("deposits.additionalNotesPlaceholder")}
                rows={4}
                className={cn(
                  "mt-2 flex w-full resize-none rounded-xl border border-border px-4 py-3 text-sm text-foreground transition-all",
                  "bg-gradient-to-b from-white/[0.06] to-white/[0.02] placeholder:text-muted/70",
                  "focus-visible:outline-none focus-visible:border-emerald/40 focus-visible:ring-[3px] focus-visible:ring-emerald/15"
                )}
              />
            </div>

            {message && (
              <p className={cn("text-sm", success ? "text-emerald" : "text-red-400")}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !frontImage}
              className="h-12 w-full rounded-xl bg-[#4B8BF5] text-sm font-semibold text-white transition-colors hover:bg-[#3d7ae8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("deposits.submitting") : t("deposits.submitGiftCard")}
            </button>
          </form>
        </div>
      </FadeIn>
    </div>
  );
}
