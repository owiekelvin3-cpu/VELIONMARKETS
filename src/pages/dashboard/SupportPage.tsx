import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MessageCircle, Plus, Search } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useUserSupport } from "@/hooks/useSupport";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SupportComposer,
  SupportEmptyState,
  SupportMessageList,
  SupportStatusBadge,
} from "@/components/support/SupportChat";
import { isConversationUnreadForUser } from "@/lib/support";
import { cn, formatDate } from "@/lib/utils";

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const support = useUserSupport(user?.id);
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return support.conversations;
    return support.conversations.filter(
      (c) => c.subject.toLowerCase().includes(q) || (c.last_message_preview ?? "").toLowerCase().includes(q)
    );
  }, [support.conversations, search]);

  const active = support.conversations.find((c) => c.id === support.activeId) ?? null;

  const handleCreate = async () => {
    if (!firstMessage.trim()) return;
    setCreating(true);
    try {
      await support.startNew(subject || t("support.defaultSubject"), firstMessage);
      setComposing(false);
      setSubject("");
      setFirstMessage("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("dashboard.navGroupAccount")}
        title={t("support.title")}
        subtitle={t("support.subtitle")}
        actions={
          <Button size="sm" onClick={() => { setComposing(true); support.setActiveId(null); }}>
            <Plus className="h-3.5 w-3.5" />
            {t("support.newConversation")}
          </Button>
        }
      />

      {support.error && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">{support.error}</p>
      )}

      <div className="surface-panel grid min-h-[70vh] overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Conversation list */}
        <aside className="flex flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("support.searchConversations")}
                className="h-10 w-full rounded-xl border border-border bg-secondary/40 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-emerald/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {support.loadingList ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted">{t("support.noConversations")}</p>
            ) : (
              filtered.map((c) => {
                const unread = isConversationUnreadForUser(c);
                const selected = c.id === support.activeId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setComposing(false); support.setActiveId(c.id); }}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors",
                      selected ? "bg-secondary/70" : "hover:bg-secondary/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                        {c.subject}
                      </p>
                      <SupportStatusBadge status={c.status} />
                    </div>
                    <p className="truncate text-xs text-muted">{c.last_message_preview || t("support.noMessagesYet")}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted">{formatDate(c.last_message_at)}</span>
                      {unread && <span className="h-2 w-2 rounded-full bg-emerald" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex min-h-[480px] flex-col bg-gradient-to-b from-secondary/20 to-transparent dark:from-secondary/10">
          {composing ? (
            <div className="flex flex-1 flex-col p-5 sm:p-8">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/15 text-emerald">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold">{t("support.startConversation")}</h2>
                    <p className="text-sm text-muted">{t("support.startHint")}</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="support-subject">{t("support.subject")}</Label>
                  <Input
                    id="support-subject"
                    className="mt-1.5"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t("support.subjectPlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="support-first">{t("support.firstMessage")}</Label>
                  <textarea
                    id="support-first"
                    className="mt-1.5 min-h-[140px] w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald/20"
                    value={firstMessage}
                    onChange={(e) => setFirstMessage(e.target.value)}
                    placeholder={t("support.firstMessagePlaceholder")}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setComposing(false)}>{t("common.cancel")}</Button>
                  <Button onClick={() => void handleCreate()} disabled={creating || !firstMessage.trim()}>
                    {creating ? t("common.loading") : t("support.send")}
                  </Button>
                </div>
              </motion.div>
            </div>
          ) : !active ? (
            <SupportEmptyState onNew={() => setComposing(true)} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">{active.subject}</p>
                  <p className="text-xs text-muted">{t("support.ticketId", { id: active.id.slice(0, 8) })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SupportStatusBadge status={active.status} />
                  {active.status === "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => void support.reopen(active.id)}>
                      {t("support.reopen")}
                    </Button>
                  )}
                </div>
              </div>
              <SupportMessageList
                messages={support.messages}
                currentUserId={user?.id ?? ""}
                loading={support.loadingMessages}
                hasMore={support.hasMore}
                onLoadMore={support.loadOlder}
              />
              {active.status === "resolved" ? (
                <div className="border-t border-border p-4 text-center text-sm text-muted">
                  {t("support.resolvedHint")}{" "}
                  <button type="button" className="font-medium text-emerald hover:underline" onClick={() => void support.reopen(active.id)}>
                    {t("support.reopen")}
                  </button>
                </div>
              ) : (
                <SupportComposer onSend={support.send} />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
