import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Archive, Pin, RotateCcw, Search, Trash2, User, HelpCircle,
} from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  SupportComposer,
  SupportEmptyState,
  SupportMessageList,
  SupportMobileChatOverlay,
  SupportStatusBadge,
  SupportThreadFrame,
} from "@/components/support/SupportChat";
import {
  addInternalNote,
  archiveConversation,
  assignConversation,
  deleteConversation,
  ensureSupportRealtimeAuth,
  fetchMessages,
  fetchNewerMessages,
  listAdminConversations,
  listAdminStaff,
  listInternalNotes,
  markConversationRead,
  mergeSupportMessages,
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
import type { SupportConversation, SupportInternalNote } from "@/types/database";

const FILTERS: AdminSupportFilter[] = ["all", "open", "pending", "resolved", "unread", "high", "archived"];
const THREAD_POLL_MS = 4_000;

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
  const [mobileDetails, setMobileDetails] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const showThread = !!active;

  const refreshList = useCallback(async (opts?: { soft?: boolean }) => {
    if (!opts?.soft) setLoadingList(true);
    setError("");
    try {
      const rows = await listAdminConversations(filter, search);
      setConversations(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      if (!opts?.soft) setLoadingList(false);
    }
  }, [filter, search]);

  useEffect(() => {
    void refreshList();
    void listAdminStaff().then(setStaff).catch(() => undefined);
  }, [refreshList]);

  const syncLatestMessages = useCallback(async (conversationId: string) => {
    const current = messagesRef.current;
    const lastPersisted = [...current].reverse().find((m) => !m.id.startsWith("temp-"));
    try {
      if (!lastPersisted) {
        const rows = await fetchMessages(conversationId, { limit: SUPPORT_PAGE_SIZE });
        setHasMore(rows.length >= SUPPORT_PAGE_SIZE);
        setMessages(rows);
        return;
      }
      const newer = await fetchNewerMessages(conversationId, lastPersisted.created_at);
      if (newer.length > 0) {
        setMessages((prev) => mergeSupportMessages(prev, newer));
      }
    } catch {
      // Keep existing messages if a soft sync fails.
    }
  }, []);

  const loadThread = useCallback(async (conversationId: string, reset = true) => {
    setLoadingMessages(true);
    try {
      const before = reset ? undefined : messagesRef.current[0]?.created_at;
      const rows = await fetchMessages(conversationId, { before, limit: SUPPORT_PAGE_SIZE });
      setHasMore(rows.length >= SUPPORT_PAGE_SIZE);
      setMessages((prev) => (reset ? rows : [...rows, ...prev]));
      const noteRows = await listInternalNotes(conversationId);
      setNotes(noteRows);
      await markConversationRead(conversationId, true);
      await refreshList({ soft: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load thread");
    } finally {
      setLoadingMessages(false);
    }
  }, [refreshList]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setNotes([]);
      setMobileDetails(false);
      return;
    }
    void loadThread(activeId, true);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      await ensureSupportRealtimeAuth();
      if (cancelled) return;

      return supabase
        .channel("admin-support-all")
        .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, (payload) => {
          void refreshList({ soft: true });
          const row = payload.new as SupportConversation | undefined;
          if (row?.id && row.id === activeIdRef.current) {
            void syncLatestMessages(row.id);
          }
        })
        .subscribe();
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    void setup().then((ch) => {
      channel = ch;
    });

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refreshList, syncLatestMessages]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    const setup = async () => {
      await ensureSupportRealtimeAuth();
      if (cancelled) return;

      return supabase
        .channel(`admin-support-msg-${activeId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
          (payload) => {
            const row = payload.new as SupportMessageWithAttachments;
            setMessages((prev) => mergeSupportMessages(prev, [{ ...row, attachments: [] }]));
            void markConversationRead(activeId, true);
            void refreshList({ soft: true });
            window.setTimeout(() => { void syncLatestMessages(activeId); }, 600);
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_attachments", filter: `conversation_id=eq.${activeId}` },
          () => { void syncLatestMessages(activeId); }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            void syncLatestMessages(activeId);
          }
        });
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    void setup().then((ch) => {
      channel = ch;
    });

    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncLatestMessages(activeId);
        void refreshList({ soft: true });
      }
    }, THREAD_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncLatestMessages(activeId);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [activeId, refreshList, syncLatestMessages]);

  const backToList = () => {
    setActiveId(null);
    setMobileDetails(false);
  };

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
      setMessages((prev) => mergeSupportMessages(prev, [{ ...saved, pending: false }]));
      await refreshList({ soft: true });
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

  const detailsPanel = active ? (
    <div className="space-y-5 p-4">
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
          className="select-input h-10 text-base"
          value={active.assigned_admin_id ?? ""}
          onChange={(e) => void assignConversation(active.id, e.target.value || null).then(() => void refreshList({ soft: true }))}
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
            onClick={() => void setConversationPriority(active.id, "normal").then(() => void refreshList({ soft: true }))}
          >
            {t("admin.priorityNormal")}
          </Button>
          <Button
            size="sm"
            variant={active.priority === "high" ? "secondary" : "outline"}
            onClick={() => void setConversationPriority(active.id, "high").then(() => void refreshList({ soft: true }))}
          >
            {t("admin.priorityHigh")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={() => void setConversationPinned(active.id, !active.pinned).then(() => void refreshList({ soft: true }))}>
          <Pin className="h-3.5 w-3.5" />
          {active.pinned ? t("admin.unpin") : t("admin.pin")}
        </Button>
        {active.status !== "resolved" ? (
          <Button size="sm" onClick={() => void updateConversationStatus(active.id, "resolved").then(() => void refreshList({ soft: true }))}>
            {t("admin.markResolved")}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => void updateConversationStatus(active.id, "open").then(() => void refreshList({ soft: true }))}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t("admin.reopen")}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => void archiveConversation(active.id, !active.archived).then(() => void refreshList({ soft: true }))}>
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

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("admin.internalNotes")}</p>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder={t("admin.notePlaceholder")}
          className="min-h-[80px] w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-base outline-none focus:ring-1 focus:ring-emerald/20"
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
    <p className="p-4 text-sm text-muted">{t("admin.selectConversation")}</p>
  );

  const threadContent = active ? (
    <>
      <SupportMessageList
        messages={messages}
        currentUserId={user?.id ?? ""}
        loading={loadingMessages}
        hasMore={hasMore}
        onLoadMore={() => activeId && void loadThread(activeId, false)}
      />
      <SupportComposer onSend={send} placeholder={t("admin.replyPlaceholder")} compact />
    </>
  ) : null;

  return (
    <div className="space-y-4">
      <div className={cn(showThread && "hidden xl:block")}>
        <PageHeader
          eyebrow={t("admin.portalLabel")}
          title={t("admin.supportTitle")}
          subtitle={t("admin.supportSubtitle")}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <div className={cn("flex gap-1 overflow-x-auto rounded-xl border border-border bg-secondary/30 p-1 scrollbar-none", showThread && "hidden xl:flex")}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "min-h-9 shrink-0 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors",
              filter === f ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
            )}
          >
            {t(`admin.supportFilter.${f}`)}
          </button>
        ))}
      </div>

      {/* Mobile inbox */}
      <div className={cn("xl:hidden", showThread && "hidden")}>
        <div className="surface-panel flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.supportSearch")}
                className="h-10 w-full rounded-full border border-border bg-secondary/40 pl-9 pr-3 text-base outline-none focus:ring-1 focus:ring-emerald/20"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
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
                  className="w-full border-b border-border px-4 py-3.5 text-left active:bg-secondary/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-medium text-foreground">
                      {c.pinned ? "📌 " : ""}
                      {c.user?.full_name || c.user?.email || t("common.investor")}
                    </p>
                    {(c.unread_count ?? 0) > 0 && (
                      <span className="rounded-full bg-emerald px-1.5 text-[10px] font-bold text-white">{c.unread_count}</span>
                    )}
                  </div>
                  <p className="truncate text-[13px] text-muted">{c.subject}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <SupportStatusBadge status={c.status} />
                    <span className="text-[11px] text-muted">{formatDate(c.last_message_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile full-screen thread */}
      <SupportMobileChatOverlay open={showThread} hideFrom="xl">
        {active && (
          mobileDetails ? (
            <SupportThreadFrame
              title={t("admin.userInfo")}
              subtitle={active.user?.email}
              onBack={() => setMobileDetails(false)}
              safeAreaTop
            >
              <div className="min-h-0 flex-1 overflow-y-auto">{detailsPanel}</div>
            </SupportThreadFrame>
          ) : (
            <SupportThreadFrame
              title={active.user?.full_name || active.user?.email || active.subject}
              subtitle={active.subject}
              onBack={backToList}
              safeAreaTop
              trailing={
                <button
                  type="button"
                  onClick={() => setMobileDetails(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-emerald hover:bg-secondary"
                  aria-label={t("admin.userInfo")}
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              }
            >
              {threadContent}
            </SupportThreadFrame>
          )
        )}
      </SupportMobileChatOverlay>

      {/* Desktop / tablet split */}
      <div className="surface-panel hidden min-h-[min(75vh,800px)] overflow-hidden xl:grid xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside className="flex min-h-0 flex-col border-r border-border">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.supportSearch")}
                className="h-10 w-full rounded-xl border border-border bg-secondary/40 pl-9 pr-3 text-base outline-none focus:ring-1 focus:ring-emerald/20"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
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

        <section className="flex min-h-0 flex-col border-r border-border">
          {active ? (
            <SupportThreadFrame
              title={active.subject}
              subtitle={active.user?.email}
              trailing={
                <div className="flex flex-wrap gap-1.5 pr-2">
                  <SupportStatusBadge status={active.status} />
                  {active.status !== "resolved" ? (
                    <Button size="sm" onClick={() => void updateConversationStatus(active.id, "resolved").then(() => void refreshList({ soft: true }))}>
                      {t("admin.markResolved")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => void updateConversationStatus(active.id, "open").then(() => void refreshList({ soft: true }))}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t("admin.reopen")}
                    </Button>
                  )}
                </div>
              }
            >
              {threadContent}
            </SupportThreadFrame>
          ) : (
            <SupportEmptyState />
          )}
        </section>

        <aside className="min-h-0 overflow-y-auto">{detailsPanel}</aside>
      </div>
    </div>
  );
}
