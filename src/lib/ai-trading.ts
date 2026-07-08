import type { AIBot } from "@/constants/ai-bots";

export function getHourlyRate(botId: string): number {
  switch (botId) {
    case "nexus": return 0.35;
    case "quantum": return 0.55;
    case "apex": return 0.85;
    default: return 0.30;
  }
}

export function getTradeRate(botId: string): number {
  switch (botId) {
    case "nexus": return 1.8;
    case "quantum": return 2.5;
    case "apex": return 3.5;
    default: return 1.5;
  }
}

export function estimatePassiveProfit(power: number, botId: string, hours: number): number {
  return Math.round(power * (getHourlyRate(botId) / 100) * hours * 100) / 100;
}

export function estimateTradeProfit(tradeAmount: number, botId: string): number {
  return Math.round(tradeAmount * (getTradeRate(botId) / 100) * 100) / 100;
}

export function estimateTotalProfit(power: number, bot: AIBot, hours: number, trades = 3): number {
  const passive = estimatePassiveProfit(power, bot.id, hours);
  const perTrade = estimateTradeProfit(power * 0.25, bot.id);
  return Math.round((passive + perTrade * trades) * 100) / 100;
}

export function getTimeRemaining(expiresAt: string): { hours: number; minutes: number; seconds: number; expired: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds, expired: false };
}

export function formatCountdown(expiresAt: string): string {
  const { hours, minutes, seconds, expired } = getTimeRemaining(expiresAt);
  if (expired) return "00:00:00";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
