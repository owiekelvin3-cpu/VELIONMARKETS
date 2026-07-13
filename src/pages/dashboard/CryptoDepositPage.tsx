import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { CryptoBrandIcon } from "@/components/dashboard/DepositIcons";
import { FadeIn } from "@/components/motion/Motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Copy, Check } from "@/lib/icons";
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";
import { useDepositConfig } from "@/hooks/useDepositConfig";
import { getCryptoWallet, getDefaultDepositConfig } from "@/lib/deposit-config";
import type { Deposit } from "@/types/database";

export default function CryptoDepositPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: depositConfig } = useDepositConfig();
  const [searchParams] = useSearchParams();
  const coinParam = searchParams.get("coin");
  const validCoin = CRYPTO_ASSETS.some((c) => c.id === coinParam) ? coinParam! : "bitcoin";
  const [selected, setSelected] = useState<string>(validCoin);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Deposit[]>([]);

  const crypto = CRYPTO_ASSETS.find((c) => c.id === selected)!;
  const wallet = getCryptoWallet(depositConfig ?? getDefaultDepositConfig(), selected);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", user.id)
      .in("method", CRYPTO_ASSETS.map((c) => c.id))
      .order("created_at", { ascending: false })
      .limit(5);
    setHistory(data ?? []);
  }, [user]);

  useEffect(() => {
    if (coinParam && CRYPTO_ASSETS.some((c) => c.id === coinParam)) {
      setSelected(coinParam);
    }
  }, [coinParam]);

  useEffect(() => { loadHistory(); }, [user, loadHistory]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase.from("deposits").insert({
      user_id: user.id,
      amount: parseFloat(amount),
      method: selected,
      status: "pending",
      notes: txHash || null,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(t("deposits.submitSuccess"));
      setAmount("");
      setTxHash("");
      loadHistory();
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <DepositPageHeader
        title={t("deposits.cryptoTitle")}
        subtitle={t("deposits.cryptoPageDesc")}
        backTo="/dashboard/deposits"
      />

      <FadeIn className="space-y-6">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
          {CRYPTO_ASSETS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`rounded-xl border p-3 text-center transition-all ${
                selected === c.id
                  ? "border-emerald/40 bg-emerald/10"
                  : "border-border bg-secondary/50 hover:border-border"
              }`}
            >
              <CryptoBrandIcon asset={c} selected={selected === c.id} />
              <span className="text-xs font-medium text-foreground">{c.symbol}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-secondary/50 p-5">
          <p className="text-sm text-muted">{t("deposits.sendTo", { asset: crypto.label })}</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-secondary px-3 py-2.5 text-xs text-emerald sm:text-sm">
              {wallet}
            </code>
            <Button type="button" variant="outline" size="icon" onClick={copyAddress} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-secondary/50 p-5">
          <div>
            <Label htmlFor="amount">{t("deposits.amountUsd")}</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="txHash">{t("deposits.txHash")}</Label>
            <Input
              id="txHash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder={t("deposits.txHashPlaceholder")}
              className="mt-2 h-11"
            />
          </div>
          {message && (
            <p className={cn("text-sm", message === t("deposits.submitSuccess") ? "text-emerald" : "text-amber-400")}>
              {message}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? t("deposits.submitting") : t("deposits.submitDeposit")}
          </Button>
        </form>

        {history.length > 0 && (
          <div className="rounded-2xl border border-border bg-secondary/50 p-5">
            <h2 className="mb-4 font-display font-semibold text-foreground">{t("deposits.recentDeposits")}</h2>
            <div className="space-y-3">
              {history.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{formatCurrency(d.amount)}</p>
                    <p className="text-xs text-muted">{d.method} · {formatDate(d.created_at)}</p>
                  </div>
                  <Badge variant={d.status === "completed" ? "success" : "warning"}>{d.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
