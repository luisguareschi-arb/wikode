"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble, type ChatMessageItem } from "@/components/chat/MessageBubble";
import { RepoBranchPicker } from "@/components/chat/RepoBranchPicker";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  initialMessages?: ChatMessageItem[];
  threadId?: string;
  threadTitle?: string | null;
  repoIds: string[];
  onRepoIdsChange?: (repoIds: string[]) => void;
  placeholder?: string;
}

function ChatComposer({
  value,
  onChange,
  onSend,
  sending,
  disabled,
  placeholder,
  error,
  helperText,
  repoIds,
  onRepoIdsChange,
  mode,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  disabled: boolean;
  placeholder?: string;
  error: string | null;
  helperText: string | null;
  repoIds: string[];
  onRepoIdsChange?: (repoIds: string[]) => void;
  mode: "empty" | "follow-up";
}) {
  const isEmpty = mode === "empty";

  return (
    <div className={cn("w-full", isEmpty ? "max-w-2xl" : "max-w-3xl mx-auto")}>
      {isEmpty && (
        <RepoBranchPicker
          selectedRepoIds={repoIds}
          onChange={onRepoIdsChange}
          className="mb-2 px-1"
        />
      )}
      <div
        className={cn(
          "rounded-xl border border-[hsl(var(--border))] bg-white",
          "focus-within:border-[hsl(0_0%_80%)]",
          !isEmpty && "relative"
        )}
      >
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void onSend();
            }
          }}
          placeholder={placeholder}
          rows={isEmpty ? 4 : 2}
          className={cn(
            "w-full resize-none rounded-xl bg-transparent px-4 text-[14px] text-[hsl(var(--app-text))] placeholder:text-[hsl(var(--app-text-muted))] focus:outline-none",
            isEmpty ? "min-h-[100px] pb-2 pt-4" : "min-h-[72px] py-3 pr-12 pb-10"
          )}
        />
        {isEmpty ? (
          <div className="flex items-center justify-between gap-2 px-3 pb-3">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-xs",
                error ? "text-red-600" : "text-[hsl(var(--app-text-muted))]"
              )}
            >
              {error ?? helperText}
            </p>
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full bg-[hsl(var(--app-text))] text-white hover:bg-[hsl(0_0%_20%)]"
              onClick={() => void onSend()}
              disabled={disabled}
              aria-label={sending ? "Sending" : "Send message"}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2} />
              )}
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-[hsl(var(--app-text))] text-white hover:bg-[hsl(0_0%_20%)]"
            onClick={() => void onSend()}
            disabled={disabled}
            aria-label={sending ? "Sending" : "Send message"}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2} />
            )}
          </Button>
        )}
      </div>
      {!isEmpty && (error || helperText) && (
        <p
          className={cn(
            "mt-1.5 text-center text-xs",
            error ? "text-red-600" : "text-[hsl(var(--app-text-muted))]"
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}

export function ChatWindow({
  initialMessages = [],
  threadId,
  threadTitle: initialThreadTitle,
  repoIds,
  onRepoIdsChange,
  placeholder,
}: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(threadId);
  const [threadTitle, setThreadTitle] = useState(initialThreadTitle?.trim() ?? "");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;
  const disabled = sending || repoIds.length === 0 || !value.trim();

  const displayTitle = useMemo(() => {
    if (threadTitle) return threadTitle;
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser?.content) return firstUser.content.slice(0, 80);
    return "New conversation";
  }, [threadTitle, messages]);

  const helperText = useMemo(() => {
    if (repoIds.length === 0) return "Select a repository to start.";
    return null;
  }, [repoIds]);

  const composerPlaceholder = isEmpty
    ? (placeholder ?? "Ask Wikode to explore, explain, or find code in your repository...")
    : "Add a follow-up";

  useEffect(() => {
    if (!scrollRef.current || isEmpty) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isEmpty, sending]);

  const sendMessage = async () => {
    const userMessage = value.trim();
    if (!userMessage || sending || repoIds.length === 0) return;
    setSending(true);
    setValue("");
    setError(null);

    if (!threadTitle) {
      setThreadTitle(userMessage.slice(0, 80));
    }

    const userEntry: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, userEntry]);

    let resolvedThreadId = activeThreadId;
    if (!resolvedThreadId) {
      const threadRes = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: userMessage.slice(0, 80),
          repoIds,
        }),
      });
      const threadData = (await threadRes.json()) as { thread?: { id: string }; error?: string };
      if (!threadRes.ok) {
        setError(threadData.error ?? "Failed to create conversation.");
        setSending(false);
        return;
      }
      resolvedThreadId = threadData.thread?.id;
      if (!resolvedThreadId) {
        setError("Failed to create conversation.");
        setSending(false);
        return;
      }
      setActiveThreadId(resolvedThreadId);
      window.dispatchEvent(new CustomEvent("wikode:threads-changed"));
      router.replace(`/chat/${resolvedThreadId}`);
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: resolvedThreadId,
        message: userMessage,
        repoIds,
      }),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(errBody?.error ?? `Chat failed (${response.status}).`);
      setSending(false);
      return;
    }

    if (!response.body) {
      setError("No response from chat service.");
      setSending(false);
      return;
    }

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (chunk.value) {
        const text = decoder.decode(chunk.value, { stream: !done });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, content: msg.content + text } : msg))
        );
      }
    }

    setSending(false);
  };

  const composer = (
    <ChatComposer
      value={value}
      onChange={setValue}
      onSend={sendMessage}
      sending={sending}
      disabled={disabled}
      placeholder={composerPlaceholder}
      error={error}
      helperText={helperText}
      repoIds={repoIds}
      onRepoIdsChange={onRepoIdsChange}
      mode={isEmpty ? "empty" : "follow-up"}
    />
  );

  if (isEmpty) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-[hsl(var(--app-surface))] px-4 py-8">
        {composer}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-[hsl(var(--app-surface))]">
      <ChatHeader
        title={displayTitle}
        repoIds={repoIds}
        onRepoIdsChange={activeThreadId ? undefined : onRepoIdsChange}
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </div>
      <div className="shrink-0 bg-[hsl(var(--app-surface))] px-4 pb-4 pt-3">
        {composer}
      </div>
    </div>
  );
}
