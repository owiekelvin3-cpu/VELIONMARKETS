import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, ExternalLink, X, ZoomIn } from "@/lib/icons";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  formatDepositMethod,
  parseDepositNotes,
  type AdminDeposit,
} from "@/lib/deposit-details";
import { cn } from "@/lib/utils";

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className={cn("text-sm text-foreground break-all", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}

function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-xs">{value}</span>
      <button type="button" onClick={copy} className="text-muted hover:text-emerald" aria-label="Copy">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

function ImagePreview({ src, label, onZoom }: { src: string; label: string; onZoom: (src: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onZoom(src)}
      className="group relative overflow-hidden rounded-xl border border-border bg-secondary/80 text-left"
    >
      <img src={src} alt={label} className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <ZoomIn className="h-6 w-6 text-white" />
      </div>
      <p className="border-t border-border px-3 py-2 text-xs text-muted">{label}</p>
    </button>
  );
}

interface DepositDetailPanelProps {
  deposit: AdminDeposit;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function DepositDetailPanel({ deposit, onClose, actions }: DepositDetailPanelProps) {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const meta = parseDepositNotes(deposit.notes, deposit.method);
  const methodLabel = formatDepositMethod(deposit.method);

  return (
    <>
      <div className="rounded-xl border border-emerald/20 bg-card/80 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">{formatCurrency(deposit.amount)}</p>
            <p className="text-sm text-muted">{methodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={deposit.status} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-secondary hover:text-foreground"
              aria-label={t("admin.closeDetails")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <dl className="space-y-3">
          <DetailRow label={t("admin.transactionId")} value={<CopyableValue value={deposit.id} />} mono />
          <DetailRow
            label={t("admin.user")}
            value={
              <>
                {deposit.profiles?.full_name || "—"}
                <span className="block text-xs text-muted">{deposit.profiles?.email || deposit.user_id}</span>
              </>
            }
          />
          <DetailRow label={t("admin.method")} value={methodLabel} />
          <DetailRow label={t("admin.amount")} value={formatCurrency(deposit.amount)} />
          <DetailRow label={t("admin.currency")} value={deposit.currency} />
          <DetailRow label={t("admin.submitted")} value={formatDate(deposit.created_at)} />
          <DetailRow label={t("admin.lastUpdated")} value={formatDate(deposit.updated_at)} />

          {meta.type === "crypto" && meta.txHash && (
            <DetailRow label={t("admin.txHash")} value={<CopyableValue value={meta.txHash} />} />
          )}

          {meta.type === "gift_card" && (
            <>
              {meta.cardCode && (
                <DetailRow label={t("admin.cardCode")} value={<CopyableValue value={meta.cardCode} />} />
              )}
              {meta.additionalNotes && (
                <DetailRow label={t("admin.additionalNotes")} value={meta.additionalNotes} />
              )}
            </>
          )}

          {meta.type === "plain" && meta.text && (
            <DetailRow label={t("admin.notes")} value={meta.text} mono />
          )}
        </dl>

        {meta.type === "gift_card" && (meta.frontImageUrl || meta.backImageUrl) && (
          <div className="mt-5 border-t border-border pt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              {t("admin.uploadedImages")}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {meta.frontImageUrl && (
                <ImagePreview
                  src={meta.frontImageUrl}
                  label={t("admin.frontImage")}
                  onZoom={setLightbox}
                />
              )}
              {meta.backImageUrl && (
                <ImagePreview
                  src={meta.backImageUrl}
                  label={t("admin.backImage")}
                  onZoom={setLightbox}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.frontImageUrl && (
                <Button variant="outline" size="sm" className="border-border" asChild>
                  <a href={meta.frontImageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    {t("admin.openFrontImage")}
                  </a>
                </Button>
              )}
              {meta.backImageUrl && (
                <Button variant="outline" size="sm" className="border-border" asChild>
                  <a href={meta.backImageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    {t("admin.openBackImage")}
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {actions && <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">{actions}</div>}
      </div>

      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          aria-label={t("admin.closeDetails")}
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      )}
    </>
  );
}
