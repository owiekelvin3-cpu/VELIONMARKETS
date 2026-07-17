import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_CURRENCIES,
  getCurrencyDisplayName,
  normalizeCurrency,
} from "@/constants/currencies";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  busy?: boolean;
}

export function CurrencySelector({ value, onChange, className, disabled, busy }: CurrencySelectorProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = normalizeCurrency(value);
  const locale = i18n.language?.split("-")[0] ?? "en";
  const currentLabel = getCurrencyDisplayName(current, locale);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(({ code }) => {
      if (code.includes(q)) return true;
      const name = getCurrencyDisplayName(code, locale).toUpperCase();
      return name.includes(q);
    });
  }, [query, locale]);

  const select = async (code: string) => {
    if (code === current || disabled || busy) return;
    await onChange(code);
    setQuery("");
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || busy}
          className={cn(
            "flex h-10 min-w-[8.5rem] items-center justify-between gap-2 rounded-full border border-border bg-surface-elevated px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 disabled:opacity-60 data-[state=open]:border-emerald/35 data-[state=open]:bg-surface-elevated",
            className
          )}
          aria-label={`${t("settingsPage.currency")}: ${currentLabel}`}
        >
          <span>{current}</span>
          <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 overflow-hidden p-0">
        <div className="border-b border-border bg-surface-elevated p-2">
          <DropdownMenuLabel className="px-1 pb-2 pt-1">{t("settingsPage.currency")}</DropdownMenuLabel>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("settingsPage.currencySearch")}
            className="h-9"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-72 overflow-y-auto bg-surface-elevated p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">{t("settingsPage.currencyNoMatch")}</p>
          ) : (
            filtered.map((currency) => (
              <DropdownMenuItem
                key={currency.code}
                onClick={() => void select(currency.code)}
                className="justify-between"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{currency.code}</span>
                  <span className="ml-2 text-muted">{getCurrencyDisplayName(currency.code, locale)}</span>
                </span>
                {current === currency.code && <Check className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface CurrencySelectFieldProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (code: string) => void;
  className?: string;
  disabled?: boolean;
}

/** Native select for compact forms (e.g. registration). */
export function CurrencySelectField({
  id = "currency",
  name = "currency",
  value,
  onChange,
  className,
  disabled,
}: CurrencySelectFieldProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language?.split("-")[0] ?? "en";

  return (
    <select
      id={id}
      name={name}
      required
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {SUPPORTED_CURRENCIES.map((currency) => (
        <option key={currency.code} value={currency.code} className="bg-void text-foreground">
          {currency.code} — {getCurrencyDisplayName(currency.code, locale)}
        </option>
      ))}
    </select>
  );
}
