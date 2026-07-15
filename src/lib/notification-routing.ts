/** Resolve dashboard path from notification title (DB trigger + admin copy). */
export function pathForNotification(title: string, isAdmin = false): string {
  const t = title.toLowerCase();

  if (t.includes("support") || t.includes("ticket") || t.includes("attachment")) {
    return isAdmin ? "/dashboard/admin/support" : "/dashboard/support";
  }
  if (t.includes("deposit")) {
    return isAdmin ? "/dashboard/admin/deposits" : "/dashboard/deposits";
  }
  if (t.includes("withdrawal") || t.includes("withdraw")) {
    return isAdmin ? "/dashboard/admin/withdrawals" : "/dashboard/withdrawals";
  }
  if (t.includes("kyc") || t.includes("verification") || t.includes("identity")) {
    return isAdmin ? "/dashboard/admin/kyc" : "/dashboard/kyc";
  }
  if (t.includes("ai") || t.includes("bot")) {
    return isAdmin ? "/dashboard/admin" : "/dashboard/ai-trading";
  }
  if (t.includes("trade") || t.includes("order") || t.includes("position")) {
    return isAdmin ? "/dashboard/admin/trades" : "/dashboard/trades";
  }
  if (t.includes("signal")) {
    return isAdmin ? "/dashboard/admin" : "/dashboard/signals";
  }
  if (t.includes("mining")) {
    return isAdmin ? "/dashboard/admin" : "/dashboard/mining";
  }
  if (t.includes("copy")) {
    return isAdmin ? "/dashboard/admin" : "/dashboard/copy-trading";
  }

  return isAdmin ? "/dashboard/admin" : "/dashboard/notifications";
}
