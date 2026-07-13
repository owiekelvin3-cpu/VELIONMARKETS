import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Archive, Pin, RotateCcw, Search, Trash2, User,
} from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  SupportComposer,
  SupportEmptyState,
  SupportMessageList,
  SupportStatusBadge,
} from "@/components/support/SupportChat";
import {
  addInternalNote,
  archiveConversation,
  assignConversation,
  deleteConversation,
  fetchMessages,
  listAdminConversations,
  listAdminStaff,
  listInternalNotes,
  markConversationRead,
  sendMessage,
  setConversationPinned,
  setConversationPriority,
  SUPPORT_PAGE_SIZE,
  updateConversationStatus,
  type AdminSupportFilter,
  type SupportConversationWithUser,
  type SupportMessageWithAttachments,
} from "@/lib/support";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import type { SupportInternalNote } from "@/types/database";

const FILTERS: AdminSupportFilter[] = ["all", "open", "pending", "resolved", "unread", "high", "archived"];

export default function AdminSupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<AdminSupportFilter>("all");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<SupportConversationWithUser[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessageWithAttachments[]>([]);
  const [notes, setNotes] = useState<SupportInternalNote[]>([]);
  const [staff, setStaff] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const rows = await listAdminConversations(filter, search);
      setConversations(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoadingList(false);
    }
  }, [filter, search]);

  useEffect(() => {
    void refreshList();
    void listAdminStaff().then(setStaff).catch(() => undefined);
  }, [refreshList]);

  const loadThread = useCallback(async (conversationId: string, reset = true) => {
    setLoadingMessages(true);
    try {
      const before = reset ? undefined : messages[0]?.created_at;
      const rows = await fetchMessages(conversationId, { before, limit: SUPPORT_PAGE_SIZE });
      setHasMore(rows.length >= SUPPORT_PAGE_SIZE);
      setMessages((prev) => (reset ? rows : [...rows, ...prev]));
      const noteRows = await listInternalNotes(conversationId);
      setNotes(noteRows);
      await markConversationRead(conversationId, true);
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load thread");
    } finally {
      setLoadingMessages(false);
    }
  }, [messages, refreshList]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setNotes([]);
      return;
    }
    void loadThread(activeId, true);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const channel = supabase
      .channel("admin-support-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () => {
        void refreshList();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refreshList]);

  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`admin-support-msg-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const row = payload.new as SupportMessageWithAttachments;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id || (row.client_id && m.client_id === row.client_id))) {
              return prev.map((m) => (m.client_id === row.client_id ? { ...row, attachments: m.attachments } : m));
            }
            if (row.sender_role === "user") {
              setTyping(true);
              setTimeout(() => setTyping(false), 700);
            }
            return [...prev, { ...row, attachments: [] }];
          });
          void markConversationRead(activeId, true);
          void refreshList();
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [activeId, refreshList]);

  const send = async (body: string, files: File[]) => {
    if (!user || !activeId) return;
    const clientId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${clientId}`,
        conversation_id: activeId,
        sender_id: user.id,
        sender_role: "admin",
        body,
        is_internal: false,
        delivered_at: null,
        read_at: null,
        client_id: clientId,
        created_at: new Date().toISOString(),
        pending: true,
        attachments: [],
      },
    ]);
    try {
      const saved = await sendMessage({
        conversationId: activeId,
        senderId: user.id,
        senderRole: "admin",
        body,
        clientId,
        files,
      });
      setMessages((prev) => prev.map((m) => (m.client_id === clientId ? { ...saved, pending: false } : m)));
      await refreshList();
    } catch {
      setMessages((prev) => prev.map((m) => (m.client_id === clientId ? { ...m, failed: true, pending: false } : m)));
    }
  };

  const saveNote = async () => {
    if (!user || !activeId || !noteDraft.trim()) return;
    const note = await addInternalNote(activeId, user.id, noteDraft);
    setNotes((prev) => [note, ...prev]);
    setNoteDraft("");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("admin.portalLabel")}
        title={t("admin.supportTitle")}
        subtitle={t("admin.supportSubtitle")}
      />

      {error && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/30 p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
            )}
          >
            {t(`admin.supportFilter.${f}`)}
          </button>
        ))}
      </div>

      <div className="surface-panel grid min-h-[75vh] overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside className="flex flex-col border-b border-border xl:border-b-0 xl:border-r">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.supportSearch")}
                className="h-10 w-full rounded-xl border border-border bg-secondary/40 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-emerald/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />)}
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted">{t("admin.supportEmpty")}</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full border-b border-border px-4 py-3 text-left transition-colors",
                    c.id === activeId ? "bg-secondary/70" : "hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.pinned ? "📌 " : ""}
                      {c.user?.full_name || c.user?.email || t("common.investor")}
                    </p>
                    {(c.unread_count ?? 0) > 0 && (
                      <span className="rounded-full bg-emerald px-1.5 text-[10px] font-bold text-white">{c.unread_count}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted">{c.subject}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <SupportStatusBadge status={c.status} />
                    <span className="text-[10px] text-muted">{formatDate(c.last_message_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-[480px] flex-col border-b border-border bg-gradient-to-b from-secondary/20 to-transparent xl:border-b-0 xl:border-r dark:from-secondary/10">
          {!active ? (
            <SupportEmptyState />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <p className="font-display text-sm font-semibold">{active.subject}</p>
                  <p className="text-xs text-muted">{active.user?.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => void setConversationPinned(active.id, !active.pinned).then(refreshList)}>
                    <Pin className="h-3.5 w-3.5" />
                    {active.pinned ? t("admin.unpin") : t("admin.pin")}
                  </Button>
                  {active.status !== "resolved" ? (
                    <Button size="sm" onClick={() => void updateConversationStatus(active.id, "resolved").then(refreshList)}>
                      {t("admin.markResolved")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => void updateConversationStatus(active.id, "open").then(refreshList)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t("admin.reopen")}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => void archiveConversation(active.id, !active.archived).then(refreshList)}>
                    <Archive className="h-3.5 w-3.5" />
                    {active.archived ? t("admin.unarchive") : t("admin.archive")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(t("admin.deleteConfirm"))) {
                        void deleteConversation(active.id).then(() => {
                          setActiveId(null);
                          void refreshList();
                        });
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <SupportMessageList
                messages={messages}
                currentUserId={user?.id ?? ""}
                loading={loadingMessages}
                hasMore={hasMore}
                onLoadMore={() => activeId && void loadThread(activeId, false)}
                typing={typing}
              />
              <SupportComposer onSend={send} placeholder={t("admin.replyPlaceholder")} />
            </>
          )}
        </section>

        <aside className="flex flex-col overflow-y-auto p-4">
          {active ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("admin.userInfo")}</p>
                <div className="surface-muted space-y-2 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted" />
                    <span className="font-medium">{active.user?.full_name || "—"}</span>
                  </div>
                  <p className="text-muted">{active.user?.email}</p>
                  <p className="text-xs text-muted">{t("admin.accountId")}: {active.user_id.slice(0, 8)}…</p>
                  <p className="text-xs text-muted">{t("admin.registered")}: {active.user?.created_at ? formatDate(active.user.created_at) : "—"}</p>
                  <p className="text-xs text-muted">{t("admin.kyc")}: {active.user?.kyc_status ?? "—"}</p>
                  <p className="text-xs text-muted">{t("admin.lastActivity")}: {formatDate(active.last_message_at)}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("admin.assign")}</p>
                <select
                  className="select-input h-10 text-sm"
                  value={active.assigned_admin_id ?? ""}
                  onChange={(e) => void assignConversation(active.id, e.target.value || null).then(refreshList)}
                >
                  <option value="">{t("admin.unassigned")}</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("admin.priority")}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={active.priority === "normal" ? "secondary" : "outline"}
                    onClick={() => void setConversationPriority(active.id, "normal").then(refreshList)}
                  >
                    {t("admin.priorityNormal")}
                  </Button>
                  <Button
                    size="sm"
                    variant={active.priority === "high" ? "secondary" : "outline"}
                    onClick={() => void setConversationPriority(active.id, "high").then(refreshList)}
                  >
                    {t("admin.priorityHigh")}
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("admin.internalNotes")}</p>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={t("admin.notePlaceholder")}
                  className="min-h-[80px] w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald/20"
                />
                <Button size="sm" className="mt-2" onClick={() => void saveNote()} disabled={!noteDraft.trim()}>
                  {t("admin.addNote")}
                </Button>
                <div className="mt-3 space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
                      <p className="text-foreground">{n.body}</p>
                      <p className="mt-1 text-muted">{formatDate(n.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">{t("admin.selectConversation")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
