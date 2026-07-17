import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X, Copy, Check, ArrowDownToLine, ArrowUpFromLine, TrendingUp, FileText,
} from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { localizeTransaction, type UserTransaction } from "@/lib/transactions";
import { cn } from "@/lib/utils";

const KIND_ICONS = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  trade: TrendingUp,
} as const;

const KIND_ACCENTS = {
  deposit: "border-emerald/40 bg-emerald text-black",
  withdrawal: "border-amber-500/40 bg-amber-400 text-black",
  trade: "border-sky-500/40 bg-sky-400 text-black",
} as const;

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "completed" || status === "approved") return "success";
  if (status === "rejected") return "destructive";
  if (status === "pending") return "warning";
  return "secondary";
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-border py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span className={cn("max-w-[65%] text-right text-sm text-foreground", mono && "break-all font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}

function formatMethod(method: string) {
  return method.replace(/^crypto_/, "").replace(/^ewallet_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TransactionReceiptPanelProps {
  transaction: UserTransaction | null;
  onClose: () => void;
}

export function TransactionReceiptPanel({ transaction, onClose }: TransactionReceiptPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [transaction, onClose]);

  if (!transaction) return null;

  const tx = localizeTransaction(transaction, t);
  const Icon = KIND_ICONS[tx.kind];
  const isOutflow = tx.kind === "withdrawal" || (tx.kind === "trade" && tx.trade_type === "sell");

  const copyRef = async () => {
    await navigator.clipboard.writeText(tx.ref_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t("transactions.receipt.close")}
      />

      <div
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden",
          "max-h-[92dvh] rounded-t-[1.5rem] border border-border bg-card text-foreground",
          "shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-h-[min(36rem,86vh)] sm:rounded-2xl"
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm", KIND_ACCENTS[tx.kind])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t("transactions.receipt.title")}
              </p>
              <h2 id="receipt-title" className="truncate font-display text-base font-semibold text-foreground sm:text-lg">
                {tx.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={t("transactions.receipt.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
          <div className="rounded-2xl border border-border bg-secondary px-5 py-5 text-center">
            <p className="text-xs text-muted">{t("transactions.receipt.amount")}</p>
            <p className={cn("mt-1 font-display text-[2rem] font-semibold tracking-tight sm:text-[2.25rem]", isOutflow ? "text-foreground" : "text-emerald")}>
              {isOutflow ? "−" : "+"}
              {formatCurrency(tx.amount)}
            </p>
            <Badge variant={statusVariant(tx.status)} className="mt-3 capitalize">
              {tx.status}
            </Badge>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-secondary px-4 py-1">
            <DetailRow label={t("transactions.receipt.type")} value={t(`transactions.kind.${tx.kind}`)} />
            <DetailRow label={t("transactions.receipt.date")} value={formatDate(tx.created_at)} />
            {tx.updated_at && tx.updated_at !== tx.created_at && (
              <DetailRow label={t("transactions.receipt.updated")} value={formatDate(tx.updated_at)} />
            )}
            <DetailRow label={t("transactions.receipt.method")} value={formatMethod(tx.subtitle)} />
            <DetailRow label={t("transactions.receipt.currency")} value={tx.currency} />
            {tx.kind === "trade" && (
              <>
                <DetailRow label={t("transactions.receipt.asset")} value={tx.asset} />
                <DetailRow label={t("transactions.receipt.tradeType")} value={tx.trade_type?.toUpperCase()} />
                <DetailRow label={t("transactions.receipt.quantity")} value={tx.quantity?.toFixed(4)} />
                <DetailRow
                  label={t("transactions.receipt.unitPrice")}
                  value={tx.unit_price != null ? formatCurrency(tx.unit_price) : null}
                />
              </>
            )}
            {tx.wallet_address && (
              <DetailRow label={t("transactions.receipt.destination")} value={tx.wallet_address} mono />
            )}
            {tx.notes && (
              <DetailRow label={t("transactions.receipt.notes")} value={tx.notes} mono />
            )}
            <DetailRow
              label={t("transactions.receipt.reference")}
              value={
                <button
                  type="button"
                  onClick={() => void copyRef()}
                  className="inline-flex items-center gap-1.5 text-emerald hover:underline"
                >
                  <span className="font-mono text-xs">
                    {tx.ref_id.slice(0, 8)}…{tx.ref_id.slice(-4)}
                  </span>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              }
            />
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
            {t("transactions.receipt.footer")}
          </p>
        </div>

        <div className="shrink-0 border-t border-border bg-card px-5 py-4 sm:px-6">
          <Button variant="outline" className="w-full border-border" onClick={onClose}>
            {t("transactions.receipt.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
