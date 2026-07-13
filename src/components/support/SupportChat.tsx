import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FileText, ImageIcon, Paperclip, Send, Smile, X,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getAttachmentUrl,
  SUPPORT_EMOJI,
  SUPPORT_MAX_FILE_BYTES,
  type SupportMessageWithAttachments,
} from "@/lib/support";
import type { SupportAttachment, SupportConversationStatus } from "@/types/database";

/** Keyboard overlap via visualViewport (iOS Safari / Android Chrome). */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset(overlap);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return inset;
}

/** Locks body scroll while a mobile chat overlay is open. */
export function useBodyScrollLock(locked: boolean, mediaQuery = "(max-width: 1023px)") {
  useEffect(() => {
    if (!locked) return;
    const mq = window.matchMedia(mediaQuery);

    const apply = () => {
      if (mq.matches) {
        document.body.style.overflow = "hidden";
        document.documentElement.classList.add("support-chat-open");
      } else {
        document.body.style.overflow = "";
        document.documentElement.classList.remove("support-chat-open");
      }
    };

    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.style.overflow = "";
      document.documentElement.classList.remove("support-chat-open");
    };
  }, [locked, mediaQuery]);
}

/** Full-viewport mobile Messages-style shell (covers dashboard chrome). */
export function SupportMobileChatOverlay({
  open,
  children,
  hideFrom = "lg",
}: {
  open: boolean;
  children: ReactNode;
  /** Match page layout breakpoint — hide overlay once desktop split is shown. */
  hideFrom?: "lg" | "xl";
}) {
  const media = hideFrom === "xl" ? "(max-width: 1279px)" : "(max-width: 1023px)";
  useBodyScrollLock(open, media);
  const keyboardInset = useKeyboardInset();

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "support-mobile-overlay fixed inset-0 z-[80] flex flex-col bg-background",
        hideFrom === "xl" ? "xl:hidden" : "lg:hidden"
      )}
      style={{
        height: keyboardInset > 0 ? `calc(100dvh - ${keyboardInset}px)` : "100dvh",
        maxHeight: keyboardInset > 0 ? `calc(100dvh - ${keyboardInset}px)` : "100dvh",
      }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body
  );
}

export function SupportStatusBadge({ status }: { status: SupportConversationStatus }) {
  const { t } = useTranslation();
  const styles: Record<SupportConversationStatus, string> = {
    open: "bg-emerald/15 text-emerald border-emerald/25",
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25",
    resolved: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
    archived: "bg-secondary text-muted border-border",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", styles[status])}>
      {t(`support.status.${status}`)}
    </span>
  );
}

export function SupportEmptyState({ onNew }: { onNew?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.75rem] border border-border bg-secondary/50 text-2xl shadow-sm">
        💬
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{t("support.emptyTitle")}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{t("support.emptyDesc")}</p>
      {onNew && (
        <Button className="mt-5 rounded-full px-6" onClick={onNew}>
          {t("support.startConversation")}
        </Button>
      )}
    </div>
  );
}

export function SupportChatSkeleton() {
  return (
    <div className="space-y-3 px-3 py-4" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "h-11 animate-pulse bg-secondary/70",
              i % 2 === 0
                ? "w-[58%] rounded-[1.15rem] rounded-br-md"
                : "w-[62%] rounded-[1.15rem] rounded-bl-md"
            )}
          />
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDayLabel(iso: string, t: (k: string) => string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("support.today");
  if (d.toDateString() === yesterday.toDateString()) return t("support.yesterday");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function AttachmentChip({ att }: { att: SupportAttachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = att.mime_type.startsWith("image/");

  useEffect(() => {
    let alive = true;
    void getAttachmentUrl(att.file_path)
      .then((u) => { if (alive) setUrl(u); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [att.file_path]);

  if (isImage && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 block overflow-hidden rounded-2xl">
        <img src={url} alt={att.file_name} className="max-h-52 max-w-full object-cover" />
      </a>
    );
  }

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-flex max-w-full items-center gap-2 rounded-2xl border border-white/20 bg-black/10 px-3 py-2 text-xs dark:bg-white/10"
    >
      {isImage ? <ImageIcon className="h-3.5 w-3.5 shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{att.file_name}</span>
    </a>
  );
}

export function SupportMessageBubble({
  message,
  isOwn,
  clustered,
}: {
  message: SupportMessageWithAttachments;
  isOwn: boolean;
  clustered?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex w-full", isOwn ? "justify-end" : "justify-start", clustered ? "mt-0.5" : "mt-2.5")}
    >
      <div
        className={cn(
          "max-w-[82%] px-3.5 py-2 text-[15px] leading-snug shadow-sm sm:max-w-[68%]",
          message.is_internal
            ? "rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
            : isOwn
              ? cn(
                  "bg-emerald text-white",
                  clustered ? "rounded-[1.15rem] rounded-br-md" : "rounded-[1.15rem] rounded-br-[4px]"
                )
              : cn(
                  "border border-border/60 bg-[#e9e9eb] text-zinc-900 dark:border-transparent dark:bg-[#2c2c2e] dark:text-zinc-50",
                  clustered ? "rounded-[1.15rem] rounded-bl-md" : "rounded-[1.15rem] rounded-bl-[4px]"
                )
        )}
      >
        {message.is_internal && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">Internal</p>
        )}
        {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
        {message.attachments?.map((att) => <AttachmentChip key={att.id} att={att} />)}
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1.5 text-[10px] tabular-nums",
            message.is_internal ? "opacity-70" : isOwn ? "text-white/70" : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          <span>{formatTime(message.created_at)}</span>
          {message.failed && <span className="text-red-400">!</span>}
          {message.pending && <span>…</span>}
        </div>
      </div>
    </motion.div>
  );
}

export function SupportMessageList({
  messages,
  currentUserId,
  loading,
  hasMore,
  onLoadMore,
  className,
}: {
  messages: SupportMessageWithAttachments[];
  currentUserId: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (messages.length === 0) return;
    const grew = messages.length > prevLen.current;
    prevLen.current = messages.length;
    if (grew) {
      bottomRef.current?.scrollIntoView({ behavior: messages.length < 8 ? "auto" : "smooth" });
    }
  }, [messages.length]);

  const items = useMemo(() => {
    const out: Array<
      | { type: "day"; key: string; label: string }
      | { type: "msg"; key: string; message: SupportMessageWithAttachments; clustered: boolean }
    > = [];
    let lastDay = "";
    let lastSender: string | null = null;
    for (const message of messages) {
      const dk = dayKey(message.created_at);
      if (dk !== lastDay) {
        out.push({ type: "day", key: `day-${dk}`, label: formatDayLabel(message.created_at, t) });
        lastDay = dk;
        lastSender = null;
      }
      const clustered = lastSender === message.sender_id;
      out.push({ type: "msg", key: message.id, message, clustered });
      lastSender = message.sender_id;
    }
    return out;
  }, [messages, t]);

  if (loading && messages.length === 0) return <SupportChatSkeleton />;

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "support-message-scroller min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4",
        className
      )}
    >
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={onLoadMore} disabled={loading}>
            {t("support.loadOlder")}
          </Button>
        </div>
      )}
      {items.map((item) =>
        item.type === "day" ? (
          <div key={item.key} className="flex justify-center py-3">
            <span className="rounded-full bg-secondary/80 px-3 py-1 text-[11px] font-medium text-muted shadow-sm">
              {item.label}
            </span>
          </div>
        ) : (
          <SupportMessageBubble
            key={item.key}
            message={item.message}
            isOwn={item.message.sender_id === currentUserId}
            clustered={item.clustered}
          />
        )
      )}
      <div ref={bottomRef} className="h-px" />
    </div>
  );
}

export function SupportComposer({
  onSend,
  disabled,
  placeholder,
  compact,
}: {
  onSend: (body: string, files: File[]) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  /** Hide desktop drop hint — used in mobile fullscreen. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    resize();
  }, [text]);

  const addFiles = (list: FileList | File[]) => {
    const next = Array.from(list).filter((f) => f.size <= SUPPORT_MAX_FILE_BYTES);
    setFiles((prev) => [...prev, ...next].slice(0, 5));
  };

  const submit = async () => {
    const body = text.trim();
    if ((!body && files.length === 0) || disabled || sending) return;
    setSending(true);
    try {
      await onSend(body, files);
      setText("");
      setFiles([]);
      setEmojiOpen(false);
      requestAnimationFrame(resize);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "support-composer shrink-0 border-t border-border/80 bg-background/95 px-2 pt-2 backdrop-blur-xl sm:px-3",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        dragOver && "ring-2 ring-inset ring-emerald/40"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
      }}
    >
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 px-1">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs">
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button type="button" aria-label={t("common.close")} onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {emojiOpen && (
        <div className="mb-2 grid max-h-32 grid-cols-8 gap-1 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-lg">
          {SUPPORT_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              className="rounded-lg p-1.5 text-lg hover:bg-secondary"
              onClick={() => {
                setText((v) => v + e);
                taRef.current?.focus();
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <button
          type="button"
          className="mb-0.5 rounded-full p-2.5 text-[#8e8e93] hover:bg-secondary hover:text-foreground"
          aria-label={t("support.attach")}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={cn(
            "mb-0.5 rounded-full p-2.5 text-[#8e8e93] hover:bg-secondary hover:text-foreground",
            emojiOpen && "bg-secondary text-foreground"
          )}
          aria-label={t("support.emoji")}
          onClick={() => setEmojiOpen((v) => !v)}
        >
          <Smile className="h-5 w-5" />
        </button>

        <div className="relative min-w-0 flex-1">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={placeholder ?? t("support.messagePlaceholder")}
            className="max-h-[120px] min-h-[36px] w-full resize-none rounded-[20px] border border-border/80 bg-secondary/50 px-4 py-2 text-[15px] leading-5 text-foreground outline-none placeholder:text-muted focus:border-emerald/35 focus:ring-1 focus:ring-emerald/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            disabled={disabled || sending}
          />
        </div>

        <Button
          size="icon"
          className="mb-0.5 h-9 w-9 shrink-0 rounded-full"
          onClick={() => void submit()}
          disabled={disabled || sending || (!text.trim() && files.length === 0)}
          aria-label={t("support.send")}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {!compact && (
        <p className="mt-1.5 hidden text-center text-[10px] text-muted sm:block">{t("support.dropHint")}</p>
      )}
    </div>
  );
}

/** Shared thread chrome: nav bar + messages + composer. */
export function SupportThreadFrame({
  title,
  subtitle,
  onBack,
  trailing,
  children,
  composer,
  className,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  children: ReactNode;
  composer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}>
      <header
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-border/80 bg-background/90 px-2 py-2.5 backdrop-blur-xl sm:px-3",
          "pt-[max(0.5rem,env(safe-area-inset-top))]"
        )}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-emerald hover:bg-secondary"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="truncate font-display text-[15px] font-semibold tracking-tight text-foreground">{title}</p>
          {subtitle && <p className="truncate text-[11px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      </header>
      <div className="support-thread-wallpaper flex min-h-0 flex-1 flex-col">{children}</div>
      {composer}
    </div>
  );
}
