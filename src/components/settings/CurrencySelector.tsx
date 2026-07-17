import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, normalizeCurrency } from "@/constants/currencies";
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = normalizeCurrency(value);
  const currentLabel = t(`currencies.${current}`, { defaultValue: current });

  const select = async (code: string) => {
    if (code === current || disabled || busy) return;
    await onChange(code);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || busy}
          className={cn(
            "flex h-10 min-w-[8.5rem] items-center justify-between gap-2 rounded-full border border-border bg-secondary/40 px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 disabled:opacity-60",
            className
          )}
          aria-label={`${t("settingsPage.currency")}: ${currentLabel}`}
        >
          <span>{current}</span>
          <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-y-auto">
        <DropdownMenuLabel>{t("settingsPage.currency")}</DropdownMenuLabel>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => void select(currency.code)}
            className="justify-between"
          >
            <span>
              <span className="font-medium">{currency.code}</span>
              <span className="ml-2 text-muted">{t(currency.labelKey)}</span>
            </span>
            {current === currency.code && <Check className="h-4 w-4 text-emerald" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
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
  const { t } = useTranslation();

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
          {currency.code} — {t(currency.labelKey)}
        </option>
      ))}
    </select>
  );
}
