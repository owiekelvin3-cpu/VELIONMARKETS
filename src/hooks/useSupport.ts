import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  createConversation,
  fetchMessages,
  isConversationUnreadForUser,
  listUserConversations,
  markConversationRead,
  sendMessage,
  SUPPORT_PAGE_SIZE,
  updateConversationStatus,
  type SupportMessageWithAttachments,
} from "@/lib/support";
import type { SupportConversation } from "@/types/database";

export function useUserSupport(userId: string | undefined) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessageWithAttachments[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshList = useCallback(async () => {
    if (!userId) return;
    setLoadingList(true);
    setError("");
    try {
      const rows = await listUserConversations(userId);
      setConversations(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoadingList(false);
    }
  }, [userId]);

  const loadMessages = useCallback(async (conversationId: string, reset = true) => {
    setLoadingMessages(true);
    setError("");
    try {
      const before = reset ? undefined : messages[0]?.created_at;
      const rows = await fetchMessages(conversationId, { before, limit: SUPPORT_PAGE_SIZE });
      setHasMore(rows.length >= SUPPORT_PAGE_SIZE);
      setMessages((prev) => (reset ? rows : [...rows, ...prev]));
      if (userId) await markConversationRead(conversationId, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [messages, userId]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeId, true);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) return;

    const convChannel = supabase
      .channel(`support-conv-user-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_conversations", filter: `user_id=eq.${userId}` },
        () => { void refreshList(); }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(convChannel);
    };
  }, [userId, refreshList]);

  useEffect(() => {
    if (!activeId) return;

    const msgChannel = supabase
      .channel(`support-msg-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const row = payload.new as SupportMessageWithAttachments;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id || (row.client_id && m.client_id === row.client_id))) {
              return prev.map((m) =>
                m.client_id && m.client_id === row.client_id ? { ...row, attachments: m.attachments, pending: false } : m
              );
            }
            if (row.sender_role === "admin") {
              setTyping(true);
              if (typingTimer.current) clearTimeout(typingTimer.current);
              typingTimer.current = setTimeout(() => setTyping(false), 600);
            }
            return [...prev, { ...row, attachments: [] }];
          });
          void markConversationRead(activeId, false);
          void refreshList();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const row = payload.new as SupportMessageWithAttachments;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(msgChannel);
    };
  }, [activeId, refreshList]);

  const startNew = async (subject: string, firstMessage: string) => {
    if (!userId) return;
    const { conversation } = await createConversation(userId, subject, firstMessage);
    await refreshList();
    setActiveId(conversation.id);
  };

  const send = async (body: string, files: File[]) => {
    if (!userId || !activeId) return;
    const clientId = crypto.randomUUID();
    const optimistic: SupportMessageWithAttachments = {
      id: `temp-${clientId}`,
      conversation_id: activeId,
      sender_id: userId,
      sender_role: "user",
      body,
      is_internal: false,
      delivered_at: null,
      read_at: null,
      client_id: clientId,
      created_at: new Date().toISOString(),
      pending: true,
      attachments: [],
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await sendMessage({
        conversationId: activeId,
        senderId: userId,
        senderRole: "user",
        body,
        clientId,
        files,
      });
      setMessages((prev) =>
        prev.map((m) => (m.client_id === clientId ? { ...saved, pending: false } : m))
      );
      await refreshList();
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.client_id === clientId ? { ...m, pending: false, failed: true } : m))
      );
    }
  };

  const reopen = async (conversationId: string) => {
    await updateConversationStatus(conversationId, "open");
    await refreshList();
  };

  const loadOlder = () => {
    if (activeId) void loadMessages(activeId, false);
  };

  const unreadTotal = conversations.filter(isConversationUnreadForUser).length;

  return {
    conversations,
    activeId,
    setActiveId,
    messages,
    loadingList,
    loadingMessages,
    hasMore,
    error,
    typing,
    startNew,
    send,
    reopen,
    loadOlder,
    refreshList,
    unreadTotal,
  };
}
