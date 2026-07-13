import { useTranslation } from "react-i18next";
import { Globe, Check } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import i18n, { ensureLocaleLoaded, type SupportedLanguage } from "@/i18n";

export const LANGUAGES = [
  { code: "en" as const, native: "English" },
  { code: "es" as const, native: "Español" },
  { code: "fr" as const, native: "Français" },
  { code: "de" as const, native: "Deutsch" },
  { code: "ar" as const, native: "العربية" },
  { code: "zh" as const, native: "中文" },
];

export type LanguageCode = SupportedLanguage;

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export function LanguageSelector({ className, showLabel = false }: LanguageSelectorProps) {
  const { t, i18n: i18nInstance } = useTranslation();
  const locale = (i18nInstance.language?.split("-")[0] || "en") as LanguageCode;
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const selectLocale = (code: LanguageCode) => {
    void ensureLocaleLoaded(code).then(() => i18n.changeLanguage(code));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-full px-2 py-2 text-muted transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40",
            className
          )}
          aria-label={`${t("common.language")}: ${current.native}`}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {showLabel && (
            <span className="text-sm font-medium uppercase">{current.code}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => selectLocale(lang.code)}
            className="justify-between"
          >
            <span>{lang.native}</span>
            {locale === lang.code && <Check className="h-4 w-4 text-emerald" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
