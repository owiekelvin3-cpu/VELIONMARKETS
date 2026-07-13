import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, Search, X } from "@/lib/icons";
import { BRAND } from "@/constants/brand";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { href: "/#markets", labelKey: "nav.markets" },
  { href: "/services", labelKey: "nav.services" },
  { href: "/trading-room", labelKey: "nav.tradingRoom" },
  { href: "/trading-signals", labelKey: "nav.signals" },
  { href: "/reviews", labelKey: "nav.community" },
] as const;

type MobileItem =
  | { type: "link"; href: string; labelKey: string; marketsHash?: boolean }
  | { type: "action"; action: "markets"; labelKey: string };

type MobileSection = {
  id: string;
  labelKey: string;
  items?: MobileItem[];
  href?: string;
};

const mobileSections: MobileSection[] = [
  {
    id: "products",
    labelKey: "nav.products",
    items: [
      { type: "link", href: "/services", labelKey: "nav.services" },
      { type: "link", href: "/trading-room", labelKey: "nav.tradingRoom" },
      { type: "link", href: "/trading-signals", labelKey: "nav.signals" },
      { type: "link", href: "/brokers", labelKey: "nav.brokers" },
    ],
  },
  {
    id: "community",
    labelKey: "nav.community",
    items: [
      { type: "link", href: "/reviews", labelKey: "nav.community" },
      { type: "link", href: "/about", labelKey: "nav.about" },
      { type: "link", href: "/payouts", labelKey: "footer.payouts" },
    ],
  },
  {
    id: "markets",
    labelKey: "nav.markets",
    items: [
      { type: "action", action: "markets", labelKey: "nav.markets" },
      { type: "link", href: "/world-economy", labelKey: "nav.economy" },
      { type: "link", href: "/world-economy/trends", labelKey: "nav.economyTrends" },
      { type: "link", href: "/forex-news", labelKey: "nav.forexNews" },
    ],
  },
  {
    id: "brokers",
    labelKey: "nav.brokers",
    href: "/brokers",
  },
  {
    id: "more",
    labelKey: "nav.more",
    items: [
      { type: "link", href: "/security", labelKey: "nav.security" },
      { type: "link", href: "/faqs", labelKey: "footer.faq" },
      { type: "link", href: "/holdings", labelKey: "footer.holdings" },
      { type: "link", href: "/verify", labelKey: "footer.verifyCertificate" },
    ],
  },
];

export function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [expanded, setExpanded] = useState<string | null>("markets");
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setHidden(y > lastY && y > 140 && !open);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY, open]);

  useEffect(() => {
    setOpen(false);
    setSearch("");
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const goMarkets = () => {
    setOpen(false);
    if (location.pathname === "/") {
      document.getElementById("markets")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#markets");
    }
  };

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return location.pathname === "/" && location.hash === "#markets";
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const toggleSection = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const filteredSections = mobileSections
    .map((section) => {
      if (!search.trim()) return section;
      const q = search.trim().toLowerCase();
      if (t(section.labelKey).toLowerCase().includes(q)) return section;
      if (!section.items) {
        return t(section.labelKey).toLowerCase().includes(q) ? section : null;
      }
      const items = section.items.filter((item) => t(item.labelKey).toLowerCase().includes(q));
      if (!items.length) return null;
      return { ...section, items };
    })
    .filter(Boolean) as MobileSection[];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed left-0 right-0 top-0 z-50 border-b transition-colors duration-300",
          scrolled
            ? "border-border bg-void/90 backdrop-blur-xl"
            : "border-transparent bg-void/40 backdrop-blur-md"
        )}
      >
        <nav
          className="container-premium flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6"
          aria-label={t("nav.mainNav")}
        >
          <Link to="/" className="group shrink-0" aria-label={`${BRAND.name} home`}>
            <Logo className="transition-opacity group-hover:opacity-90" wordmarkClassName="hidden sm:inline" />
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex">
            {desktopLinks.map((link) =>
              link.href.startsWith("/#") ? (
                <button
                  key={link.href}
                  type="button"
                  onClick={goMarkets}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(link.href) ? "text-emerald" : "text-muted hover:text-foreground"
                  )}
                >
                  {t(link.labelKey)}
                </button>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(link.href) ? "text-emerald" : "text-muted hover:text-foreground"
                  )}
                >
                  {t(link.labelKey)}
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-emerald to-transparent"
                    />
                  )}
                </Link>
              )
            )}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            <LanguageSelector />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">{t("common.signIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth?mode=register">{t("common.getStarted")}</Link>
            </Button>
          </div>

          {/* TradingView-style mobile top bar: Get started + hamburger */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Button size="sm" className="h-9 rounded-full px-3.5 text-xs font-semibold" asChild>
              <Link to="/auth?mode=register">{t("common.getStarted")}</Link>
            </Button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label={t("nav.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.mobileMenu")}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label={t("nav.closeMenu")}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-void shadow-2xl"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <Logo wordmarkClassName="inline" />
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary"
                  onClick={() => setOpen(false)}
                  aria-label={t("nav.closeMenu")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-border px-4 py-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("nav.searchPlaceholder")}
                    className="h-11 w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3 text-sm text-foreground outline-none ring-emerald/40 placeholder:text-muted focus:ring-2"
                  />
                </label>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <nav className="px-2 py-2">
                  {filteredSections.map((section) => {
                    const hasItems = Boolean(section.items?.length);
                    const isOpen = expanded === section.id || Boolean(search.trim());

                    if (!hasItems && section.href) {
                      return (
                        <Link
                          key={section.id}
                          to={section.href}
                          className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[17px] font-semibold text-foreground hover:bg-secondary/60"
                        >
                          {t(section.labelKey)}
                        </Link>
                      );
                    }

                    return (
                      <div key={section.id} className="border-b border-border/60 last:border-0">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-[17px] font-semibold text-foreground hover:bg-secondary/60"
                          aria-expanded={isOpen}
                        >
                          {t(section.labelKey)}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && section.items && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-0.5 pb-3 pl-2">
                                {section.items.map((item) =>
                                  item.type === "action" ? (
                                    <button
                                      key={item.labelKey}
                                      type="button"
                                      onClick={goMarkets}
                                      className="block w-full rounded-lg px-4 py-2.5 text-left text-[15px] text-muted hover:bg-secondary/50 hover:text-foreground"
                                    >
                                      {t(item.labelKey)}
                                    </button>
                                  ) : (
                                    <Link
                                      key={item.href}
                                      to={item.href}
                                      className={cn(
                                        "block rounded-lg px-4 py-2.5 text-[15px] hover:bg-secondary/50 hover:text-foreground",
                                        isActive(item.href) ? "text-emerald" : "text-muted"
                                      )}
                                    >
                                      {t(item.labelKey)}
                                    </Link>
                                  )
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-3 border-t border-border px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-border bg-secondary/30 px-3 py-2">
                    <span className="text-xs text-muted">{t("common.language")}</span>
                    <LanguageSelector showLabel />
                  </div>
                  <ThemeToggle />
                </div>
                <Button asChild className="h-12 w-full rounded-full text-sm font-semibold">
                  <Link to="/auth?mode=register">{t("nav.getStartedFree")}</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full text-muted">
                  <Link to="/auth">{t("common.signIn")}</Link>
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
