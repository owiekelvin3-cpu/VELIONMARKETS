import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Bot, Brain, Activity, TrendingUp, Zap, BarChart3, Clock,
  ArrowRight, Sparkles, Wallet, ChevronRight, Coins, Timer, History,
} from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion/Motion";
import { AI_BOTS, BOT_DURATIONS, CRYPTO_ASSETS, LIVE_SIGNALS } from "@/constants/ai-bots";
import {
  estimatePassiveProfit, estimateTotalProfit, estimateTradeProfit,
  formatCountdown, getHourlyRate, getTradeRate,
} from "@/lib/ai-trading";
import { ensureValidSession } from "@/lib/auth-session";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AISubscription {
  id: string;
  bot_id: string | null;
  bot_name: string;
  allocation: number;
  duration_hours: number;
  expires_at: string | null;
  crypto_asset: string;
  profit_earned: number;
  market: string;
  status: string;
  created_at: string;
}

interface AIBotTrade {
  id: string;
  subscription_id: string;
  crypto_asset: string;
  trade_amount: number;
  profit: number;
  created_at: string;
}

const RISK_VARIANT = {
  low: "success" as const,
  medium: "warning" as const,
  high: "destructive" as const,
};

type AITab = "bots" | "purchase" | "active" | "history";

export default function AITradingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [subs, setSubs] = useState<AISubscription[]>([]);
  const [trades, setTrades] = useState<AIBotTrade[]>([]);
  const [selectedBot, setSelectedBot] = useState(AI_BOTS[0].id);
  const [durationHours, setDurationHours] = useState(24);
  const [cryptoAsset, setCryptoAsset] = useState("BTC");
  const [power, setPower] = useState("");
  const [tradeAmount, setTradeAmount] = useState("");
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [feedIndex, setFeedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<AITab>("bots");
  const [tick, setTick] = useState(0);

  const bot = AI_BOTS.find((b) => b.id === selectedBot)!;
  const powerNum = parseFloat(power) || 0;

  const syncBots = useCallback(async () => {
    if (!user) return;
    await ensureValidSession();
    await supabase.rpc("sync_user_ai_bots");
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    await syncBots();
    const [balRes, subRes, tradeRes] = await Promise.all([
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
      supabase.from("ai_trading_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("ai_bot_trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (balRes.error && balRes.error.code !== "PGRST116") setMessage(balRes.error.message);
    if (subRes.error) setMessage(subRes.error.message);
    setBalance(balRes.data?.amount ?? 0);
    const loaded = (subRes.data as AISubscription[]) ?? [];
    setSubs(loaded);
    setTrades((tradeRes.data as AIBotTrade[]) ?? []);
    const firstActive = loaded.find((s) => s.status === "active");
    if (firstActive && !selectedSubId) setSelectedSubId(firstActive.id);
  }, [user, syncBots, selectedSubId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setFeedIndex((i) => (i + 1) % LIVE_SIGNALS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const syncTimer = setInterval(() => { loadData(); }, 30000);
    return () => clearInterval(syncTimer);
  }, [user, loadData]);

  const activeSubs = subs.filter((s) => s.status === "active");
  const completedSubs = subs.filter((s) => s.status === "completed");
  const selectedSub = subs.find((s) => s.id === selectedSubId) ?? activeSubs[0] ?? null;
  const totalProfit = activeSubs.reduce((sum, s) => sum + (s.profit_earned ?? 0), 0);
  const totalPower = activeSubs.reduce((sum, s) => sum + s.allocation, 0);
  const signal = LIVE_SIGNALS[feedIndex];

  const estimatedProfit = estimateTotalProfit(powerNum, bot, durationHours);
  const passiveOnly = estimatePassiveProfit(powerNum, bot.id, durationHours);

  const selectBotToPurchase = (botId: string) => {
    setSelectedBot(botId);
    setActiveTab("purchase");
    setMessage("");
  };

  const handlePurchase = async () => {
    if (!user) return;
    if (!powerNum || powerNum < bot.minPower) {
      setMessage(t("aiTrading.minPower", { amount: formatCurrency(bot.minPower) }));
      return;
    }
    if (powerNum > balance) {
      setMessage(t("aiTrading.insufficientBalance"));
      return;
    }

    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.from("ai_trading_subscriptions").insert({
      user_id: user.id,
      bot_id: bot.id,
      bot_name: bot.name,
      allocation: powerNum,
      duration_hours: durationHours,
      crypto_asset: cryptoAsset,
      market: "crypto",
      status: "active",
    }).select().single();

    if (error) {
      setMessage(error.message.includes("Insufficient") ? t("aiTrading.insufficientBalance") : error.message);
    } else {
      setMessage(t("aiTrading.purchased"));
      setPower("");
      if (data) setSelectedSubId(data.id);
      await loadData();
      setActiveTab("active");
    }
    setLoading(false);
  };

  const handleTrade = async () => {
    if (!selectedSub) return;
    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0) {
      setMessage(t("aiTrading.invalidTradeAmount"));
      return;
    }
    if (amount > selectedSub.allocation) {
      setMessage(t("aiTrading.tradeExceedsPower"));
      return;
    }

    setLoading(true);
    setMessage("");
    await ensureValidSession();
    const { error } = await supabase.rpc("execute_ai_bot_trade", {
      p_subscription_id: selectedSub.id,
      p_trade_amount: amount,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(t("aiTrading.tradeSuccess", {
        profit: formatCurrency(estimateTradeProfit(amount, selectedSub.bot_id ?? "nexus")),
      }));
      setTradeAmount("");
      await loadData();
    }
    setLoading(false);
  };

  const subTrades = selectedSub
    ? trades.filter((tr) => tr.subscription_id === selectedSub.id)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <FadeIn>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald">
              <Bot className="h-3.5 w-3.5" />
              {t("aiTrading.badge")}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{t("aiTrading.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("aiTrading.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="border-white/10 bg-white/[0.03]">
              <Link to="/dashboard/deposits">
                <Wallet className="mr-2 h-4 w-4" />
                {t("aiTrading.addFunds")}
              </Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted">{t("aiTrading.availableBalance")}: </span>
            <span className="font-semibold text-emerald">{formatCurrency(balance)}</span>
          </div>
          {activeSubs.length > 0 && (
            <>
              <div>
                <span className="text-muted">{t("aiTrading.totalPower")}: </span>
                <span className="font-semibold">{formatCurrency(totalPower)}</span>
              </div>
              <div>
                <span className="text-muted">{t("aiTrading.liveProfit")}: </span>
                <span className="font-semibold text-emerald">+{formatCurrency(totalProfit)}</span>
              </div>
            </>
          )}
        </div>
        {activeSubs.length > 0 && (
          <button type="button" onClick={() => setActiveTab("active")} className="text-xs font-medium text-emerald hover:underline">
            {t("aiTrading.viewActiveBots", { count: activeSubs.length })}
          </button>
        )}
      </FadeIn>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AITab)} className="space-y-6">
        <div className="sticky top-16 z-20 -mx-4 border-b border-white/[0.06] bg-[#060608]/95 px-4 py-3 backdrop-blur-xl lg:static lg:mx-0 lg:rounded-2xl lg:border lg:bg-white/[0.02] lg:px-3">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-transparent p-0 lg:rounded-full lg:bg-white/[0.03] lg:p-1">
            <TabsTrigger value="bots" className="gap-1.5 rounded-lg lg:rounded-full">
              <Bot className="h-4 w-4" />
              {t("aiTrading.nav.bots")}
            </TabsTrigger>
            <TabsTrigger value="purchase" className="gap-1.5 rounded-lg lg:rounded-full">
              <Sparkles className="h-4 w-4" />
              {t("aiTrading.nav.purchase")}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5 rounded-lg lg:rounded-full">
              <Zap className="h-4 w-4" />
              {t("aiTrading.nav.trade")}
              {activeSubs.length > 0 && (
                <span className="ml-1 rounded-full bg-emerald/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald">
                  {activeSubs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 rounded-lg lg:rounded-full">
              <History className="h-4 w-4" />
              {t("aiTrading.nav.history")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Available bots */}
        <TabsContent value="bots" className="mt-0 space-y-6 focus-visible:outline-none">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("aiTrading.availableBots"), value: AI_BOTS.length.toString(), icon: Bot },
              { label: t("aiTrading.activeBots"), value: activeSubs.length.toString(), icon: Activity },
              { label: t("aiTrading.totalPower"), value: formatCurrency(totalPower), icon: BarChart3 },
              { label: t("aiTrading.liveProfit"), value: `+${formatCurrency(totalProfit)}`, icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-muted">
                  <stat.icon className="h-4 w-4" />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <p className="mt-2 font-display text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted">{t("aiTrading.selectBotHint")}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {AI_BOTS.map((b) => (
              <div key={b.id} className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${b.accent}20` }}>
                    <span style={{ color: b.accent }}><Bot className="h-5 w-5" /></span>
                  </div>
                  <Badge variant={RISK_VARIANT[b.risk]}>{t(`aiTrading.risk.${b.risk}`)}</Badge>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{b.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{b.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-white/[0.03] p-2.5">
                    <p className="text-[10px] text-muted">{t("aiTrading.hourlyReturn")}</p>
                    <p className="font-semibold text-emerald">{b.hourlyReturn}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-2.5">
                    <p className="text-[10px] text-muted">{t("aiTrading.winLabel")}</p>
                    <p className="font-semibold text-foreground">{b.winRate}%</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted">
                  {t("aiTrading.minPowerLabel")} {formatCurrency(b.minPower)}
                </p>
                <Button className="mt-4 w-full" onClick={() => selectBotToPurchase(b.id)}>
                  {t("aiTrading.purchaseBot")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t("aiTrading.howItWorks")}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { step: "01", title: t("aiTrading.step1Title"), desc: t("aiTrading.step1Desc"), icon: Brain },
                { step: "02", title: t("aiTrading.step2Title"), desc: t("aiTrading.step2Desc"), icon: Timer },
                { step: "03", title: t("aiTrading.step3Title"), desc: t("aiTrading.step3Desc"), icon: Coins },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-emerald" />
                    <span className="text-xs font-semibold text-emerald">{item.step}</span>
                  </div>
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="mt-1 text-sm text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
              </span>
              <h3 className="text-sm font-semibold">{t("aiTrading.liveAnalysis")}</h3>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{signal.bot}</Badge>
                <span className="font-mono text-emerald">{signal.asset}</span>
                <span className="text-muted">{signal.confidence}% {t("aiTrading.confidence")}</span>
              </div>
              <p className="mt-2 text-sm">{signal.action}</p>
            </div>
          </div>
        </TabsContent>

        {/* Purchase */}
        <TabsContent value="purchase" className="mt-0 focus-visible:outline-none">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-wider text-muted">{t("aiTrading.selectedBot")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AI_BOTS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBot(b.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        selectedBot === b.id ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-white/[0.06] text-muted"
                      )}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted">{bot.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-xs text-muted">{t("aiTrading.hourlyReturn")}</p>
                    <p className="font-semibold text-emerald">{bot.hourlyReturn}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-xs text-muted">{t("aiTrading.tradeProfitRate")}</p>
                    <p className="font-semibold text-emerald">{getTradeRate(bot.id)}%/{t("aiTrading.perTrade")}</p>
                  </div>
                </div>
              </div>

              {powerNum >= bot.minPower && (
                <div className="rounded-2xl border border-emerald/20 bg-emerald/5 p-5">
                  <p className="text-xs font-medium uppercase text-emerald">{t("aiTrading.estimatedProfit")}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-emerald">+{formatCurrency(estimatedProfit)}</p>
                  <p className="mt-2 text-xs text-muted">
                    {t("aiTrading.estimatedBreakdown", {
                      passive: formatCurrency(passiveOnly),
                      hours: durationHours,
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold">{t("aiTrading.purchaseTitle")}</h2>
                <p className="mt-1 text-sm text-muted">{t("aiTrading.purchaseDesc", { bot: bot.name })}</p>

                <div className="mt-6 space-y-5">
                  <div>
                    <Label className="text-sm">{t("aiTrading.runDuration")}</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {BOT_DURATIONS.map((d) => (
                        <button
                          key={d.hours}
                          type="button"
                          onClick={() => setDurationHours(d.hours)}
                          className={cn(
                            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                            durationHours === d.hours
                              ? "border-emerald/40 bg-emerald/10 text-emerald"
                              : "border-white/[0.06] text-muted hover:text-foreground"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">{t("aiTrading.cryptoAsset")}</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {CRYPTO_ASSETS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCryptoAsset(c.id)}
                          className={cn(
                            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                            cryptoAsset === c.id
                              ? "border-emerald/40 bg-emerald/10 text-emerald"
                              : "border-white/[0.06] text-muted hover:text-foreground"
                          )}
                        >
                          {c.pair}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="power">{t("aiTrading.botPower")}</Label>
                    <Input
                      id="power"
                      type="number"
                      min={bot.minPower}
                      step="0.01"
                      value={power}
                      onChange={(e) => setPower(e.target.value)}
                      placeholder={bot.minPower.toString()}
                      className="mt-2 h-12 text-base"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[0.25, 0.5, 1].map((pct) => {
                        const amt = Math.floor(balance * pct);
                        if (amt < bot.minPower) return null;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setPower(amt.toString())}
                            className="rounded-md border border-white/[0.06] px-2.5 py-1 text-xs text-muted hover:border-emerald/30 hover:text-emerald"
                          >
                            {pct === 1 ? t("aiTrading.max") : `${pct * 100}%`}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {t("aiTrading.powerHint", { rate: getHourlyRate(bot.id) })}
                    </p>
                  </div>

                  {message && (
                    <p className={cn("text-sm", message.includes("+") || message.includes("purchased") || message.includes("success") ? "text-emerald" : "text-amber-400")}>
                      {message}
                    </p>
                  )}

                  <Button className="h-12 w-full text-base" onClick={handlePurchase} disabled={loading}>
                    {loading ? t("aiTrading.purchasing") : t("aiTrading.purchaseNow", { amount: powerNum > 0 ? formatCurrency(powerNum) : "" })}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Active trading */}
        <TabsContent value="active" className="mt-0 space-y-4 focus-visible:outline-none">
          {activeSubs.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
              <Bot className="mx-auto h-12 w-12 text-muted" />
              <p className="mt-4 font-medium">{t("aiTrading.noActiveBots")}</p>
              <p className="mt-1 text-sm text-muted">{t("aiTrading.noActiveBotsDesc")}</p>
              <Button className="mt-6" onClick={() => setActiveTab("bots")}>
                {t("aiTrading.browseBots")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {activeSubs.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSubId(s.id)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      selectedSub?.id === s.id ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-white/[0.06] text-muted"
                    )}
                  >
                    {s.bot_name} · {s.crypto_asset}
                  </button>
                ))}
              </div>

              {selectedSub && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{selectedSub.bot_name}</h3>
                        <p className="text-sm text-muted">{selectedSub.crypto_asset}/USDT · {selectedSub.duration_hours}h run</p>
                      </div>
                      <Badge variant="success">{t("aiTrading.running")}</Badge>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/[0.03] p-4">
                        <p className="text-xs text-muted">{t("aiTrading.botPower")}</p>
                        <p className="mt-1 font-display text-xl font-bold">{formatCurrency(selectedSub.allocation)}</p>
                      </div>
                      <div className="rounded-xl bg-emerald/10 p-4">
                        <p className="text-xs text-muted">{t("aiTrading.profitEarned")}</p>
                        <p className="mt-1 font-display text-xl font-bold text-emerald">+{formatCurrency(selectedSub.profit_earned ?? 0)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                      <Clock className="h-5 w-5 text-emerald" />
                      <div>
                        <p className="text-xs text-muted">{t("aiTrading.timeRemaining")}</p>
                        <p className="font-mono text-lg font-bold text-foreground" key={tick}>
                          {selectedSub.expires_at ? formatCountdown(selectedSub.expires_at) : "—"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-muted">{t("aiTrading.payoutNote")}</p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="font-display text-lg font-semibold">{t("aiTrading.tradeCrypto")}</h3>
                    <p className="mt-1 text-sm text-muted">{t("aiTrading.tradeCryptoDesc", {
                      asset: selectedSub.crypto_asset,
                      rate: getTradeRate(selectedSub.bot_id ?? "nexus"),
                    })}</p>

                    <div className="mt-5 space-y-4">
                      <div>
                        <Label htmlFor="tradeAmount">{t("aiTrading.tradeAmount")}</Label>
                        <Input
                          id="tradeAmount"
                          type="number"
                          min={1}
                          max={selectedSub.allocation}
                          value={tradeAmount}
                          onChange={(e) => setTradeAmount(e.target.value)}
                          placeholder={`Max ${formatCurrency(selectedSub.allocation)}`}
                          className="mt-2 h-12"
                        />
                        {tradeAmount && parseFloat(tradeAmount) > 0 && (
                          <p className="mt-2 text-sm text-emerald">
                            {t("aiTrading.expectedTradeProfit")}: +{formatCurrency(
                              estimateTradeProfit(parseFloat(tradeAmount), selectedSub.bot_id ?? "nexus")
                            )}
                          </p>
                        )}
                      </div>

                      {message && (
                        <p className={cn("text-sm", message.includes("+") || message.includes("success") ? "text-emerald" : "text-amber-400")}>
                          {message}
                        </p>
                      )}

                      <Button className="h-12 w-full" onClick={handleTrade} disabled={loading}>
                        {loading ? t("aiTrading.trading") : t("aiTrading.executeTrade")}
                      </Button>
                    </div>

                    {subTrades.length > 0 && (
                      <div className="mt-6">
                        <p className="mb-2 text-xs font-medium uppercase text-muted">{t("aiTrading.recentTrades")}</p>
                        <div className="max-h-40 space-y-2 overflow-y-auto">
                          {subTrades.map((tr) => (
                            <div key={tr.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                              <span className="text-muted">{tr.crypto_asset} · {formatCurrency(tr.trade_amount)}</span>
                              <span className="font-medium text-emerald">+{formatCurrency(tr.profit)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-0 focus-visible:outline-none">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="font-display text-lg font-semibold">{t("aiTrading.historyTitle")}</h2>
            {completedSubs.length === 0 ? (
              <p className="mt-6 py-8 text-center text-sm text-muted">{t("aiTrading.noHistory")}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {completedSubs.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-4">
                    <div>
                      <p className="font-medium">{s.bot_name}</p>
                      <p className="text-xs text-muted">
                        {s.crypto_asset} · {s.duration_hours}h · {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted">{formatCurrency(s.allocation)} power</p>
                      <p className="font-semibold text-emerald">+{formatCurrency(s.profit_earned ?? 0)} profit</p>
                    </div>
                    <Badge variant="secondary">{t("aiTrading.completed")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
