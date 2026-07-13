import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { deliverNotification } from "@/lib/notification-delivery";
import type { Notification } from "@/types/database";

interface UseNotificationsOptions {
  /** Where browser push / notification click should open */
  pushTargetPath?: string;
}

const POLL_MS = 30_000;

export function useNotifications(userId: string | undefined, options?: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const pushTargetPath = options?.pushTargetPath ?? "/dashboard";
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const handleIncoming = useCallback((notification: Notification, isNew: boolean) => {
    if (isNew && !knownIdsRef.current.has(notification.id)) {
      knownIdsRef.current.add(notification.id);
      deliverNotification(notification, { url: pushTargetPath });
    }
  }, [pushTargetPath]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    await ensureValidSession();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = data ?? [];

    if (!initializedRef.current) {
      rows.forEach((n) => knownIdsRef.current.add(n.id));
      initializedRef.current = true;
    } else {
      for (const n of rows) {
        if (!knownIdsRef.current.has(n.id)) {
          handleIncoming(n, true);
        }
      }
    }

    setNotifications(rows);
    setLoading(false);
  }, [userId, handleIncoming]);

  useEffect(() => {
    initializedRef.current = false;
    knownIdsRef.current = new Set();
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });
          handleIncoming(notification, true);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[notifications] Realtime channel issue:", status);
        }
      });

    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, POLL_MS);

    return () => {
      clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [userId, handleIncoming, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
