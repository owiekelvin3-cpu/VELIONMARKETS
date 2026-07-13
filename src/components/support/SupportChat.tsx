import { useEffect, useMemo, useRef, useState } from "react";
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
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-secondary/50 text-2xl shadow-sm">
        💬
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{t("support.emptyTitle")}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{t("support.emptyDesc")}</p>
      {onNew && (
        <Button className="mt-5" onClick={onNew}>
          {t("support.startConversation")}
        </Button>
      )}
    </div>
  );
}

export function SupportChatSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
          <div className={cn("h-12 w-[55%] animate-pulse rounded-2xl bg-secondary/70", i % 2 === 0 && "rounded-br-md")} />
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
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl">
        <img src={url} alt={att.file_name} className="max-h-48 max-w-full object-cover" />
      </a>
    );
  }

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/20 bg-black/10 px-3 py-2 text-xs dark:bg-white/10"
    >
      {isImage ? <ImageIcon className="h-3.5 w-3.5 shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{att.file_name}</span>
    </a>
  );
}

export function SupportMessageBubble({
  message,
  isOwn,
}: {
  message: SupportMessageWithAttachments;
  isOwn: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
          message.is_internal
            ? "rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
            : isOwn
              ? "rounded-br-md bg-emerald text-white"
              : "rounded-bl-md border border-border bg-card text-foreground dark:bg-secondary/80"
        )}
      >
        {message.is_internal && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">Internal</p>
        )}
        {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
        {message.attachments?.map((att) => <AttachmentChip key={att.id} att={att} />)}
        <div className={cn("mt-1 flex items-center justify-end gap-1.5 text-[10px]", isOwn ? "text-white/75" : "text-muted")}>
          <span>{formatTime(message.created_at)}</span>
          {message.failed && <span className="text-red-300">!</span>}
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
}: {
  messages: SupportMessageWithAttachments[];
  currentUserId: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const items = useMemo(() => {
    const out: Array<{ type: "day"; key: string; label: string } | { type: "msg"; key: string; message: SupportMessageWithAttachments }> = [];
    let lastDay = "";
    for (const message of messages) {
      const dk = dayKey(message.created_at);
      if (dk !== lastDay) {
        out.push({ type: "day", key: `day-${dk}`, label: formatDayLabel(message.created_at, t) });
        lastDay = dk;
      }
      out.push({ type: "msg", key: message.id, message });
    }
    return out;
  }, [messages, t]);

  if (loading && messages.length === 0) return <SupportChatSkeleton />;

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loading}>
            {t("support.loadOlder")}
          </Button>
        </div>
      )}
      {items.map((item) =>
        item.type === "day" ? (
          <div key={item.key} className="flex justify-center py-2">
            <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] font-medium text-muted">
              {item.label}
            </span>
          </div>
        ) : (
          <SupportMessageBubble
            key={item.key}
            message={item.message}
            isOwn={item.message.sender_id === currentUserId}
          />
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export function SupportComposer({
  onSend,
  disabled,
  placeholder,
}: {
  onSend: (body: string, files: File[]) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "sticky bottom-0 border-t border-border bg-background/95 p-3 backdrop-blur-xl sm:p-4",
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
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs">
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[140px] truncate">{f.name}</span>
              <button type="button" aria-label={t("common.close")} onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {emojiOpen && (
        <div className="mb-2 grid max-h-36 grid-cols-8 gap-1 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-lg">
          {SUPPORT_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              className="rounded-lg p-1.5 text-lg hover:bg-secondary"
              onClick={() => setText((v) => v + e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          className="rounded-xl p-2.5 text-muted hover:bg-secondary hover:text-foreground"
          aria-label={t("support.attach")}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
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
          className={cn("rounded-xl p-2.5 text-muted hover:bg-secondary hover:text-foreground", emojiOpen && "bg-secondary text-foreground")}
          aria-label={t("support.emoji")}
          onClick={() => setEmojiOpen((v) => !v)}
        >
          <Smile className="h-4 w-4" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder={placeholder ?? t("support.messagePlaceholder")}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-emerald/30 focus:ring-1 focus:ring-emerald/20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          disabled={disabled || sending}
        />
        <Button
          size="icon"
          className="h-11 w-11 shrink-0 rounded-2xl"
          onClick={() => void submit()}
          disabled={disabled || sending || (!text.trim() && files.length === 0)}
          aria-label={t("support.send")}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted">{t("support.dropHint")}</p>
    </div>
  );
}
