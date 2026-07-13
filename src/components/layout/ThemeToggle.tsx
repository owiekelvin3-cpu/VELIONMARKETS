import { useTranslation } from "react-i18next";
import { Moon, Sun } from "@/lib/icons";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 text-foreground transition-colors hover:border-emerald/30 hover:text-emerald",
        showLabel ? "h-10 px-3 text-sm" : "h-10 w-10",
        className
      )}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={isDark ? t("theme.light") : t("theme.dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span>{isDark ? t("theme.light") : t("theme.dark")}</span>}
    </button>
  );
}

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const options: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t("theme.light"), icon: Sun },
    { id: "dark", label: t("theme.dark"), icon: Moon },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all",
            theme === id
              ? "border-emerald/40 bg-emerald/10 text-emerald"
              : "border-border bg-secondary/30 text-muted hover:border-emerald/20 hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
