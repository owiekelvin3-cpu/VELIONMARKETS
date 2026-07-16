import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Clock } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { WithdrawMethodIcon } from "@/components/dashboard/WithdrawIcons";
import { WITHDRAW_METHODS, type WithdrawMethodId } from "@/constants/withdrawal-methods";

function MethodRow({
  method,
  href,
  title,
  description,
  timing,
}: {
  method: WithdrawMethodId;
  href: string;
  title: string;
  description: string;
  timing: string;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 px-4 py-4",
        "transition-colors hover:border-border hover:bg-secondary/70"
      )}
    >
      <WithdrawMethodIcon method={method} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-foreground sm:text-base">{title}</h3>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <Clock className="h-3 w-3" />
            {timing}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{description}</p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}

/** Clean method picker for the withdrawals hub — no promo grids. */
export function WithdrawFundsShowcase() {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">
          {t("withdrawals.chooseMethod")}
        </h2>
        <p className="mt-1 text-xs text-muted sm:text-sm">{t("withdrawals.chooseMethodHint")}</p>
      </div>
      <div className="space-y-2.5">
        {WITHDRAW_METHODS.map((m) => (
          <MethodRow
            key={m.id}
            method={m.id}
            href={m.href}
            title={t(m.titleKey)}
            description={t(m.descKey)}
            timing={t(m.timingKey)}
          />
        ))}
      </div>
    </div>
  );
}
