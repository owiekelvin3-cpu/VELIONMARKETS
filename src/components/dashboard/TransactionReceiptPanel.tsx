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
  deposit: "text-emerald bg-emerald/10 border-emerald/20",
  withdrawal: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  trade: "text-sky-400 bg-sky-500/10 border-sky-500/20",
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
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      <span className={cn("text-sm text-foreground sm:text-right", mono && "font-mono text-xs break-all")}>{value}</span>
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t("transactions.receipt.close")}
      />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", KIND_ACCENTS[tx.kind])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{t("transactions.receipt.title")}</p>
              <h2 className="font-display text-lg font-bold text-foreground">{tx.title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-2xl border border-border bg-secondary/20 p-5 text-center">
            <p className="text-xs text-muted">{t("transactions.receipt.amount")}</p>
            <p className={cn("mt-1 font-display text-3xl font-bold", isOutflow ? "text-foreground" : "text-emerald")}>
              {isOutflow ? "−" : "+"}{formatCurrency(tx.amount)}
            </p>
            <Badge variant={statusVariant(tx.status)} className="mt-3 capitalize">{tx.status}</Badge>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
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
                <DetailRow label={t("transactions.receipt.unitPrice")} value={tx.unit_price != null ? formatCurrency(tx.unit_price) : null} />
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
                <button type="button" onClick={copyRef} className="inline-flex items-center gap-1.5 text-emerald hover:underline">
                  <span className="font-mono text-xs">{tx.ref_id.slice(0, 8)}…{tx.ref_id.slice(-4)}</span>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              }
            />
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <FileText className="h-3.5 w-3.5" />
            {t("transactions.receipt.footer")}
          </p>
        </div>

        <div className="border-t border-border p-5">
          <Button variant="outline" className="w-full" onClick={onClose}>
            {t("transactions.receipt.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
