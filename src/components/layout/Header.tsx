import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "@/lib/icons";
import { BRAND } from "@/constants/brand";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/services", labelKey: "nav.services" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/security", labelKey: "nav.security" },
  { href: "/reviews", labelKey: "nav.reviews" },
] as const;

export function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > lastY && y > 120);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  useEffect(() => {
    setOpen(false);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, location.pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6"
      >
        <nav
          className={cn(
            "container-premium flex h-16 items-center justify-between rounded-2xl px-4 transition-all duration-500 sm:px-6",
            scrolled
              ? "glass-strong shadow-[0_12px_48px_rgba(0,0,0,0.45)]"
              : "glass"
          )}
          aria-label={t("nav.mainNav")}
        >
          <Link to="/" className="group" aria-label={`${BRAND.name} home`}>
            <Logo className="transition-opacity group-hover:opacity-90" wordmarkClassName="hidden sm:inline" />
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "text-emerald"
                    : "text-muted hover:text-foreground"
                )}
              >
                {t(link.labelKey)}
                {location.pathname === link.href && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-emerald to-transparent"
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <LanguageSelector />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">{t("common.signIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth?mode=register">{t("common.openAccount")}</Link>
            </Button>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-white/5 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-void/90 backdrop-blur-2xl lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-white/8 bg-gradient-to-b from-charcoal/95 to-void p-6 pt-24"
              onClick={(e) => e.stopPropagation()}
            >
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={link.href}
                    className="block border-b border-white/5 py-5 font-display text-xl font-medium text-foreground"
                  >
                    {t(link.labelKey)}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-auto flex flex-col gap-3 pt-8">
                <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <span className="text-sm text-muted">{t("common.language")}</span>
                  <LanguageSelector showLabel />
                </div>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth">{t("common.signIn")}</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/auth?mode=register">{t("common.openAccount")}</Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
