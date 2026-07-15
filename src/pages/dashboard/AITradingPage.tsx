import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Bot, ArrowRight, Wallet, ChevronRight, Clock, History,
  CheckCircle, HelpCircle, Sparkles, Activity, BarChart3,
} from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/motion/Motion";
import {
  AI_BOTS, BEGINNER_CRYPTO, BEGINNER_DURATIONS, CRYPTO_ASSETS, LIVE_SIGNALS, RECOMMENDED_BOT_ID, getBotName,
} from "@/constants/ai-bots";
import {
  estimateTotalProfit, estimateTradeProfit, estimatePassiveProfit,
  computeLiveProfit, getTradeRate, getHourlyRate, getProjectedPayout,
  formatCountdown,
} from "@/lib/ai-trading";
import { AITradingProfitPanel } from "@/components/dashboard/AITradingProfitPanel";
import { ensureValidSession } from "@/lib/auth-session";
import { hasSeenWalkthrough } from "@/lib/ai-trading-onboarding";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import AITradingWalkthrough from "@/components/dashboard/AITradingWalkthrough";

interface AISubscription {
  id: string;
  bot_id: string | null;
  bot_name: string;
  allocation: number;
  duration_hours: number;
  expires_at: string | null;
  crypto_asset: string;
  profit_earned: number;
  last_sync_at: string | null;
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

type WizardStep = 1 | 2 | 3;
type PageView = "start" | "mybot" | "history";

function StepPill({
  n, label, active, done, onClick,
}: { n: number; label: string; active: boolean; done: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors sm:justify-start sm:px-3.5",
        active ? "border-border bg-secondary/70" : "border-transparent bg-secondary/30",
        onClick && !active && "hover:bg-secondary/50",
        done && !active && "text-muted"
      )}
    >
      <span className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
        done ? "bg-emerald text-black" : active ? "bg-foreground text-background" : "bg-secondary text-muted"
      )}>
        {done ? <CheckCircle className="h-3.5 w-3.5" /> : n}
      </span>
      <span className={cn("hidden text-sm font-medium sm:inline", active ? "text-foreground" : "text-muted")}>
        {label}
      </span>
    </button>
  );
}

export default function AITradingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [subs, setSubs] = useState<AISubscription[]>([]);
  const [trades, setTrades] = useState<AIBotTrade[]>([]);
  const [selectedBot, setSelectedBot] = useState(RECOMMENDED_BOT_ID);
  const [durationHours, setDurationHours] = useState(24);
  const [cryptoAsset, setCryptoAsset] = useState("BTC");
  const [power, setPower] = useState("");
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [view, setView] = useState<PageView>("start");
  const [tick, setTick] = useState(0);
  const [showAllCrypto, setShowAllCrypto] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [tradeAmount, setTradeAmount] = useState("");
  const [signalIndex, setSignalIndex] = useState(0);

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
    setBalance(balRes.data?.amount ?? 0);
    const loaded = (subRes.data as AISubscription[]) ?? [];
    setSubs(loaded);
    setTrades((tradeRes.data as AIBotTrade[]) ?? []);
    const firstActive = loaded.find((s) => s.status === "active");
    if (firstActive && !selectedSubId) setSelectedSubId(firstActive.id);
  }, [user, syncBots, selectedSubId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (!user) return;
    if (!hasSeenWalkthrough(user.id)) setShowWalkthrough(true);
  }, [user]);
  useEffect(() => {
    const timer = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!user) return;
    const syncTimer = setInterval(() => { loadData(); }, 10000);
    return () => clearInterval(syncTimer);
  }, [user, loadData]);
  useEffect(() => {
    const signalTimer = setInterval(() => {
      setSignalIndex((i) => (i + 1) % LIVE_SIGNALS.length);
    }, 4000);
    return () => clearInterval(signalTimer);
  }, []);

  const activeSubs = subs.filter((s) => s.status === "active");
  const completedSubs = subs.filter((s) => s.status === "completed");
  const selectedSub = subs.find((s) => s.id === selectedSubId) ?? activeSubs[0] ?? null;
  const totalProfit = activeSubs.reduce((sum, s) => sum + computeLiveProfit(s), 0);
  const estimatedProfit = estimateTotalProfit(powerNum, bot, durationHours);
  const passiveEstimate = estimatePassiveProfit(powerNum, bot.id, durationHours);
  const needsFunds = balance < bot.minPower;
  const isSuccessMsg = message.includes("+") || message.includes("!") || message.toLowerCase().includes("success");

  const startWizard = () => { setView("start"); setWizardStep(1); setMessage(""); };
  const goToMyBot = () => { setView("mybot"); setMessage(""); };

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
      setView("mybot");
      setWizardStep(1);
    }
    setLoading(false);
  };

  const handleQuickTrade = async (pct: number) => {
    if (!selectedSub) return;
    const amount = Math.floor(selectedSub.allocation * pct);
    if (amount <= 0) return;
    await executeTrade(amount);
  };

  const executeTrade = async (amount: number) => {
    if (!selectedSub) return;
    setLoading(true);
    setMessage("");
    await ensureValidSession();
    const { error } = await supabase.rpc("execute_ai_bot_trade", {
      p_subscription_id: selectedSub.id,
      p_trade_amount: amount,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(t("aiTrading.tradeSuccess", {
        profit: formatCurrency(estimateTradeProfit(amount, selectedSub.bot_id ?? "nexus")),
      }));
      setTradeAmount("");
      await loadData();
    }
    setLoading(false);
  };

  const handleManualTrade = async () => {
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
    await executeTrade(amount);
  };

  const selectedLiveProfit = selectedSub ? computeLiveProfit(selectedSub) : 0;
  const selectedPayout = selectedSub ? getProjectedPayout(selectedSub) : 0;
  const currentSignal = LIVE_SIGNALS[signalIndex];

  const subTrades = selectedSub ? trades.filter((tr) => tr.subscription_id === selectedSub.id) : [];
  const cryptoOptions = showAllCrypto ? CRYPTO_ASSETS : BEGINNER_CRYPTO;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {user && (
        <AITradingWalkthrough
          userId={user.id}
          open={showWalkthrough}
          onClose={() => setShowWalkthrough(false)}
          onComplete={() => { setView("start"); setWizardStep(1); }}
        />
      )}

      <PageHeader
        eyebrow={t("aiTrading.badgeBeginner")}
        title={t("aiTrading.titleSimple")}
        subtitle={t("aiTrading.subtitleSimple")}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWalkthrough(true)}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {t("aiTrading.walkthrough.replay")}
          </Button>
        }
      />

      <div className="surface-panel overflow-hidden rounded-3xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{t("aiTrading.yourBalance")}</p>
            <p className="font-display text-2xl font-semibold text-foreground">{formatCurrency(balance)}</p>
          </div>
          {needsFunds ? (
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to="/dashboard/deposits">
                <Wallet className="h-4 w-4" />
                {t("aiTrading.addFundsFirst")}
              </Link>
            </Button>
          ) : activeSubs.length > 0 ? (
            <div className="sm:text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{t("aiTrading.liveProfit")}</p>
              <p className="font-display text-xl font-semibold text-emerald">+{formatCurrency(totalProfit)}</p>
            </div>
          ) : (
            <Button size="sm" onClick={startWizard} className="w-full sm:w-auto">
              <Sparkles className="h-3.5 w-3.5" />
              {t("aiTrading.nav.start")}
            </Button>
          )}
        </div>
      </div>

      {activeSubs.length > 0 && (
        <FadeIn>
          <AITradingProfitPanel subscriptions={activeSubs} tick={tick} />
        </FadeIn>
      )}

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-secondary/30 p-1">
        <Button
          variant={view === "start" ? "secondary" : "ghost"}
          size="sm"
          onClick={startWizard}
        >
          {t("aiTrading.nav.start")}
        </Button>
        <Button
          variant={view === "mybot" ? "secondary" : "ghost"}
          size="sm"
          onClick={goToMyBot}
          disabled={activeSubs.length === 0}
        >
          {t("aiTrading.nav.myBot")}
          {activeSubs.length > 0 && (
            <span className="ml-1 rounded-md bg-emerald/15 px-1.5 text-[10px] font-bold text-emerald">{activeSubs.length}</span>
          )}
        </Button>
        <Button
          variant={view === "history" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => { setView("history"); setMessage(""); }}
        >
          <History className="h-3.5 w-3.5" />
          {t("aiTrading.nav.history")}
        </Button>
      </div>

      {message && (
        <p className={cn("rounded-xl border px-4 py-3 text-sm", isSuccessMsg
          ? "border-emerald/30 bg-emerald/10 text-emerald"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
        )}>{message}</p>
      )}

      {/* ── START WIZARD ── */}
      {view === "start" && (
        <div className="space-y-6">
          {/* Step pills */}
          <div className="flex gap-2">
            <StepPill n={1} label={t("aiTrading.step1Short")} active={wizardStep === 1} done={wizardStep > 1} onClick={() => wizardStep > 1 && setWizardStep(1)} />
            <StepPill n={2} label={t("aiTrading.step2Short")} active={wizardStep === 2} done={wizardStep > 2} onClick={() => wizardStep > 2 && setWizardStep(2)} />
            <StepPill n={3} label={t("aiTrading.step3Short")} active={wizardStep === 3} done={false} />
          </div>

          {/* Step 1 — Pick a bot */}
          {wizardStep === 1 && (
            <FadeIn className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <h2 className="font-display text-lg font-semibold">{t("aiTrading.step1Title")}</h2>
                <p className="mt-1 text-sm text-muted">
                  {t("aiTrading.step1Desc", { bot: getBotName(RECOMMENDED_BOT_ID) })}
                </p>
              </div>

              <div className="space-y-3">
                {AI_BOTS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBot(b.id)}
                    className={cn(
                      "w-full rounded-2xl border p-5 text-left transition-all",
                      selectedBot === b.id
                        ? "border-emerald/50 bg-emerald/10 shadow-[0_0_24px_rgba(16,185,129,0.08)]"
                        : "border-border bg-secondary/50 hover:border-border"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${b.accent}20`, color: b.accent }}>
                        <Bot className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-semibold">{b.name}</h3>
                          {b.beginnerFriendly && (
                            <Badge variant="success" className="text-[10px]">{t("aiTrading.recommended")}</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted">{b.simpleDescription}</p>
                        <p className="mt-2 text-xs text-muted">
                          {t("aiTrading.startsAt")} {formatCurrency(b.minPower)} · {b.hourlyReturn} {t("aiTrading.perHour")}
                        </p>
                      </div>
                      {selectedBot === b.id && <CheckCircle className="h-5 w-5 shrink-0 text-emerald" />}
                    </div>
                  </button>
                ))}
              </div>

              <Button className="h-12 w-full text-base" onClick={() => setWizardStep(2)}>
                {t("aiTrading.continue")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </FadeIn>
          )}

          {/* Step 2 — Set your plan */}
          {wizardStep === 2 && (
            <FadeIn className="space-y-5">
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <h2 className="font-display text-lg font-semibold">{t("aiTrading.step2Title")}</h2>
                <p className="mt-1 text-sm text-muted">{t("aiTrading.step2Desc")}</p>
              </div>

              {/* Duration */}
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <Label className="text-base font-medium">{t("aiTrading.howLong")}</Label>
                <p className="mt-1 text-xs text-muted">{t("aiTrading.howLongHint")}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {BEGINNER_DURATIONS.map((d) => (
                    <button
                      key={d.hours}
                      type="button"
                      onClick={() => setDurationHours(d.hours)}
                      className={cn(
                        "rounded-xl border py-4 text-center transition-colors",
                        durationHours === d.hours
                          ? "border-emerald/40 bg-emerald/10 text-emerald"
                          : "border-border bg-secondary/50 text-foreground hover:border-border"
                      )}
                    >
                      <p className="font-display text-lg font-bold">{d.shortLabel}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{t(d.labelKey)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crypto */}
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <Label className="text-base font-medium">{t("aiTrading.whichCoin")}</Label>
                <p className="mt-1 text-xs text-muted">{t("aiTrading.whichCoinHint")}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {cryptoOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCryptoAsset(c.id)}
                      className={cn(
                        "rounded-xl border py-4 text-center transition-colors",
                        cryptoAsset === c.id
                          ? "border-emerald/40 bg-emerald/10 text-emerald"
                          : "border-border bg-secondary/50 hover:border-border"
                      )}
                    >
                      <p className="font-display text-lg font-bold">{c.id}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{c.label}</p>
                    </button>
                  ))}
                </div>
                {!showAllCrypto && (
                  <button type="button" onClick={() => setShowAllCrypto(true)} className="mt-2 text-xs text-emerald hover:underline">
                    {t("aiTrading.showMoreCoins")}
                  </button>
                )}
              </div>

              {/* Amount */}
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <Label htmlFor="power" className="text-base font-medium">{t("aiTrading.howMuch")}</Label>
                <p className="mt-1 text-xs text-muted">{t("aiTrading.howMuchHint", { min: formatCurrency(bot.minPower) })}</p>
                <Input
                  id="power"
                  type="number"
                  min={bot.minPower}
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  placeholder={formatCurrency(bot.minPower)}
                  className="mt-3 h-14 text-center text-xl font-bold"
                />
                {powerNum >= bot.minPower && (
                  <p className="mt-3 text-center text-xs text-emerald">
                    {t("aiTrading.powerHint", { rate: getHourlyRate(bot.id) })}
                    {" · "}
                    +{formatCurrency(estimatePassiveProfit(powerNum, bot.id, durationHours))} {t("aiTrading.estimatedProfit").toLowerCase()}
                  </p>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: t("aiTrading.amountLow"), pct: 0.25 },
                    { label: t("aiTrading.amountMid"), pct: 0.5 },
                    { label: t("aiTrading.amountMax"), pct: 1 },
                  ].map(({ label, pct }) => {
                    const amt = Math.floor(balance * pct);
                    if (amt < bot.minPower) return null;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPower(amt.toString())}
                        className="rounded-xl border border-border bg-secondary/50 py-3 text-center hover:border-emerald/30"
                      >
                        <p className="text-xs text-muted">{label}</p>
                        <p className="font-semibold text-emerald">{formatCurrency(amt)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="h-12 flex-1 border-border" onClick={() => setWizardStep(1)}>
                  {t("aiTrading.back")}
                </Button>
                <Button
                  className="h-12 flex-[2] text-base"
                  onClick={() => setWizardStep(3)}
                  disabled={!powerNum || powerNum < bot.minPower}
                >
                  {t("aiTrading.continue")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </FadeIn>
          )}

          {/* Step 3 — Review & start */}
          {wizardStep === 3 && (
            <FadeIn className="space-y-5">
              <div className="rounded-2xl border border-emerald/20 bg-emerald/5 p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-emerald">{t("aiTrading.estimatedProfit")}</p>
                <p className="mt-2 font-display text-4xl font-bold text-emerald">
                  +{formatCurrency(powerNum >= bot.minPower ? estimatedProfit : 0)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {t("aiTrading.estimatedBreakdown", {
                    passive: formatCurrency(passiveEstimate),
                    hours: durationHours,
                  })}
                </p>
                <p className="mt-1 text-xs text-muted">{t("aiTrading.profitDisclaimer")}</p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/50 p-5 space-y-4">
                <h2 className="font-display text-lg font-semibold">{t("aiTrading.reviewTitle")}</h2>
                {[
                  { label: t("aiTrading.reviewBot"), value: bot.name },
                  { label: t("aiTrading.reviewDuration"), value: `${durationHours}h` },
                  { label: t("aiTrading.reviewCoin"), value: cryptoAsset },
                  { label: t("aiTrading.reviewAmount"), value: formatCurrency(powerNum) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0 last:pb-0">
                    <span className="text-muted">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-4">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <p className="text-xs leading-relaxed text-muted">{t("aiTrading.whatHappensNext")}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="h-12 flex-1 border-border" onClick={() => setWizardStep(2)}>
                  {t("aiTrading.back")}
                </Button>
                <Button
                  className="h-14 flex-[2] text-base"
                  onClick={handlePurchase}
                  disabled={loading || needsFunds || powerNum < bot.minPower}
                >
                  {loading ? t("aiTrading.purchasing") : t("aiTrading.startBot")}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </FadeIn>
          )}
        </div>
      )}

      {/* ── MY BOT ── */}
      {view === "mybot" && (
        <FadeIn className="space-y-5">
          {activeSubs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-secondary/50 py-16 text-center">
              <Bot className="mx-auto h-12 w-12 text-muted" />
              <p className="mt-4 font-medium">{t("aiTrading.noActiveBots")}</p>
              <p className="mt-1 text-sm text-muted">{t("aiTrading.noActiveBotsDesc")}</p>
              <Button className="mt-6" onClick={startWizard}>
                {t("aiTrading.startNow")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : selectedSub && (
            <>
              {/* Live analysis feed */}
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald" />
                  <h3 className="font-display text-sm font-semibold">{t("aiTrading.liveAnalysis")}</h3>
                </div>
                <div className="mt-3 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-emerald">{getBotName(currentSignal.botId)}</p>
                    <Badge variant="success" className="text-[10px]">
                      {currentSignal.confidence}% {t("aiTrading.confidence")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium">{currentSignal.asset}</p>
                  <p className="mt-1 text-xs text-muted">{currentSignal.action}</p>
                </div>
              </div>

              {/* Bot status card */}
              <div className="rounded-2xl border border-emerald/20 bg-emerald/5 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">{t("aiTrading.botRunning")}</p>
                    <h2 className="font-display text-xl font-bold">{selectedSub.bot_name}</h2>
                    <p className="mt-1 text-xs text-muted">{selectedSub.crypto_asset} · {getHourlyRate(selectedSub.bot_id ?? "nexus")}%/hr</p>
                  </div>
                  <Badge variant="success">{t("aiTrading.running")}</Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-secondary/80 p-4">
                    <p className="text-xs text-muted">{t("aiTrading.liveProfit")}</p>
                    <p className="mt-1 font-display text-xl font-bold text-emerald" key={tick}>
                      +{formatCurrency(selectedLiveProfit)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/80 p-4">
                    <p className="text-xs text-muted">{t("aiTrading.profitEarned")}</p>
                    <p className="mt-1 font-display text-xl font-bold text-foreground">
                      +{formatCurrency(selectedSub.profit_earned ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/80 p-4">
                    <p className="text-xs text-muted">{t("aiTrading.projectedPayout")}</p>
                    <p className="mt-1 font-display text-xl font-bold text-foreground" key={`p-${tick}`}>
                      {formatCurrency(selectedPayout)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/80 p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {t("aiTrading.timeRemaining")}
                    </div>
                    <p className="mt-1 font-mono text-xl font-bold" key={tick}>
                      {selectedSub.expires_at ? formatCountdown(selectedSub.expires_at) : "—"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted">{t("aiTrading.payoutNote")}</p>
              </div>

              {/* Manual trade */}
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald" />
                  <h3 className="font-display text-lg font-semibold">{t("aiTrading.tradeCrypto")}</h3>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t("aiTrading.tradeCryptoDesc", {
                    asset: selectedSub.crypto_asset,
                    rate: getTradeRate(selectedSub.bot_id ?? "nexus"),
                  })}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <Label htmlFor="trade-amount" className="text-xs">{t("aiTrading.tradeAmount")}</Label>
                    <Input
                      id="trade-amount"
                      type="number"
                      min={1}
                      max={selectedSub.allocation}
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder={formatCurrency(Math.floor(selectedSub.allocation * 0.25))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-col justify-end sm:w-48">
                    <p className="text-xs text-muted">{t("aiTrading.expectedTradeProfit")}</p>
                    <p className="font-semibold text-emerald">
                      +{formatCurrency(estimateTradeProfit(parseFloat(tradeAmount) || 0, selectedSub.bot_id ?? "nexus"))}
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={handleManualTrade} disabled={loading || !tradeAmount}>
                  {loading ? t("aiTrading.trading") : t("aiTrading.executeTrade")}
                </Button>
              </div>

              {/* Quick trade buttons */}
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <h3 className="font-display text-lg font-semibold">{t("aiTrading.makeProfit")}</h3>
                <p className="mt-1 text-sm text-muted">{t("aiTrading.makeProfitDesc")}</p>
                <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted">
                  {t("aiTrading.makeProfitExample", {
                    amount: formatCurrency(selectedSub.allocation),
                    small: formatCurrency(Math.floor(selectedSub.allocation * 0.25)),
                    medium: formatCurrency(Math.floor(selectedSub.allocation * 0.5)),
                    big: formatCurrency(selectedSub.allocation),
                  })}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: t("aiTrading.tradeSmall"), pct: 0.25 },
                    { label: t("aiTrading.tradeMedium"), pct: 0.5 },
                    { label: t("aiTrading.tradeLarge"), pct: 1 },
                  ].map(({ label, pct }) => {
                    const amt = Math.floor(selectedSub.allocation * pct);
                    const profit = estimateTradeProfit(amt, selectedSub.bot_id ?? "nexus");
                    return (
                      <button
                        key={pct}
                        type="button"
                        disabled={loading || amt <= 0}
                        onClick={() => handleQuickTrade(pct)}
                        className="rounded-xl border border-border bg-secondary/50 py-4 text-center transition-colors hover:border-emerald/30 hover:bg-emerald/5 disabled:opacity-40"
                      >
                        <p className="text-xs font-medium text-foreground">{label}</p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {t("aiTrading.tradePctOfInvestment", { pct: Math.round(pct * 100) })}
                        </p>
                        <p className="mt-1 font-semibold text-foreground">{formatCurrency(amt)}</p>
                        <p className="mt-1 text-xs font-medium text-emerald">+{formatCurrency(profit)}</p>
                      </button>
                    );
                  })}
                </div>

                {subTrades.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-medium text-muted">{t("aiTrading.recentTrades")}</p>
                    <div className="space-y-2">
                      {subTrades.slice(0, 5).map((tr) => (
                        <div key={tr.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                          <span className="text-muted">{tr.crypto_asset}</span>
                          <span className="font-medium text-emerald">+{formatCurrency(tr.profit)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {activeSubs.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {activeSubs.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSubId(s.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        selectedSub.id === s.id ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-border text-muted"
                      )}
                    >
                      {s.bot_name}
                    </button>
                  ))}
                </div>
              )}

              <Button variant="outline" className="w-full border-border" onClick={startWizard}>
                {t("aiTrading.buyAnother")}
              </Button>
            </>
          )}
        </FadeIn>
      )}

      {/* ── HISTORY ── */}
      {view === "history" && (
        <FadeIn className="rounded-2xl border border-border bg-secondary/50 p-5">
          <h2 className="font-display text-lg font-semibold">{t("aiTrading.historyTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("aiTrading.historyDesc")}</p>
          {completedSubs.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted">{t("aiTrading.noHistory")}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {completedSubs.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-4">
                  <div>
                    <p className="font-medium">{s.bot_name}</p>
                    <p className="text-xs text-muted">{s.crypto_asset} · {s.duration_hours}h</p>
                  </div>
                  <p className="font-semibold text-emerald">+{formatCurrency(s.profit_earned ?? 0)}</p>
                </div>
              ))}
            </div>
          )}
        </FadeIn>
      )}
    </div>
  );
}
